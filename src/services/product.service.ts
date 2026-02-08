import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, ProductVariant } from '../models/inventory.models';
import { AuditService } from './audit.service';
import { UserService } from './user.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private _products = signal<Product[]>([]);
  products = this._products.asReadonly();
  totalElements = signal(0);

  // Stats for the dashboard
  totalProducts = computed(() => this._products().length);
  lowStockProducts = computed(() => this._products().filter(p => p.totalStockGrams > 0 && p.totalStockGrams <= 5000));
  outOfStockProducts = computed(() => this._products().filter(p => p.totalStockGrams === 0 && p.status !== 'Inactive'));

  private getEquivalentInGrams(unit: string): number {
    const u = unit.toLowerCase().trim();
    if (u === '1kg' || u === '1 kg') return 1000;
    if (u === '500gm' || u === '500 gm' || u === '500g') return 500;
    if (u === '250gm' || u === '250 gm' || u === '250g') return 250;
    if (u === '1 litre' || u === '1 l') return 1000;
    if (u === '500ml' || u === '500 ml') return 500;

    // fallback parsing logic
    const match = u.match(/^(\d+)\s*(kg|g|gm|l|ml)$/);
    if (match) {
      const val = parseInt(match[1]);
      const type = match[2];
      if (type === 'kg' || type === 'l') return val * 1000;
      return val;
    }
    return 0;
  }

  inventoryValue = computed(() => {
    return this._products().reduce((totalValue, product) => {
      // Find the variant with the smallest gram equivalent to serve as a base for valuation
      if (product.variants.length > 0) {
        const baseVariant = product.variants.reduce((smallest, current) => {
          const smallestGrams = this.getEquivalentInGrams(smallest.unit);
          const currentGrams = this.getEquivalentInGrams(current.unit);
          return (currentGrams < smallestGrams && currentGrams > 0) ? current : smallest;
        }, product.variants[0]);

        const baseGrams = this.getEquivalentInGrams(baseVariant.unit);
        if (baseGrams > 0) {
          const pricePerGram = baseVariant.sellingPrice / baseGrams;
          totalValue += product.totalStockGrams * pricePerGram;
        }
      }
      return totalValue;
    }, 0);
  });

  constructor(private http: HttpClient, private auditService: AuditService, private userService: UserService) {
    this.loadProducts();
  }

  loadProducts() {
    this.searchProducts({});
  }

  searchProducts(criteria: { query?: string, filters?: any, pageIndex?: number, pageSize?: number }) {
    this.http.post<{ success: boolean, data: Product[], count: number, total: number, totalElements: number }>(`${environment.apiUrl}/products/search`, criteria)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._products.set(response.data);
            this.totalElements.set(response.totalElements);
          }
        },
        error: (err) => console.error('Failed to search products', err)
      });
  }

  addProduct(product: Omit<Product, 'id'>) {
    this.http.post<{ success: boolean, data: Product }>(`${environment.apiUrl}/products`, product)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._products.update(products => [...products, response.data]);
            this.auditService.log(
              'Product Added',
              `New product "${response.data.name}" (SKU: ${response.data.sku}) was created.`,
              response.data.id,
              response.data.name
            );
          }
        },
        error: (err) => console.error('Failed to add product', err)
      });
  }

  updateProduct(id: string, updates: Partial<Product>) {
    this.http.patch<{ success: boolean, data: Product }>(`${environment.apiUrl}/products/${id}`, updates)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._products.update(products =>
              products.map(p => p.id === id ? response.data : p)
            );
            this.auditService.log('Product Updated', `Product "${response.data.name}" was updated.`, id, response.data.name);
          }
        },
        error: (err) => console.error('Failed to update product', err)
      });
  }

  deleteProduct(productId: string) {
    this.http.delete<{ success: boolean }>(`${environment.apiUrl}/products/${productId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._products.update(products => products.filter(p => p.id !== productId));
            this.auditService.log(
              'Product Deleted',
              `Product with ID ${productId} was deleted.`,
              productId,
              'Unknown'
            );
          }
        },
        error: (err) => console.error('Failed to delete product', err)
      });
  }

  updateStock(productId: string, variantUnit: string, change: number, fromOrder: boolean = false) {
    const product = this._products().find(p => p.id === productId);
    if (!product) return;

    // Calculate new stock state without mutating original fully
    const variant = product.variants.find(v => v.unit === variantUnit);

    if (variant) {
      const equivalentGrams = this.getEquivalentInGrams(variant.unit);
      const changeInGrams = change * equivalentGrams;
      const newTotalStockGrams = Math.max(0, product.totalStockGrams + changeInGrams);

      let newStatus = product.status;
      if (newTotalStockGrams === 0) {
        newStatus = 'Out of Stock';
      } else if (product.status === 'Out of Stock' && newTotalStockGrams > 0) {
        newStatus = 'Active';
      }

      const updates: Partial<Product> = {
        totalStockGrams: newTotalStockGrams,
        status: newStatus
      };


      // Update local state first for immediate UI feedback (optimistic update) implementation detail can vary but ensure API is called
      this.updateProduct(productId, updates);

      if (!fromOrder) {
        this.auditService.log(
          'Stock Updated',
          `Stock for "${product.name}" changed. Change triggered by update of ${change} x ${variantUnit}.`,
          productId,
          product.name
        );
      }
    }
  }

  checkStockStatus(product: Product): Product {
    if (product.status === 'Inactive') {
      return product;
    }
    if (product.totalStockGrams === 0) {
      product.status = 'Out of Stock';
    } else if (product.status === 'Out of Stock' && product.totalStockGrams > 0) {
      product.status = 'Active';
    }
    return product;
  }
}