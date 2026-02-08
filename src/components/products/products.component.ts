import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { Product, ProductStatus, ProductVariant } from '../../models/inventory.models';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
})
export class ProductsComponent {
  searchTerm = signal('');
  filterStatus = signal('all');
  pageIndex = signal(0);
  pageSize = signal(10);

  showModal = signal(false);
  isEditMode = signal(false);
  editingProductId = signal<string | null>(null);
  showFilters = signal(false);

  predefinedUnits = ['1kg', '500gm', '250gm', '1 Dozen', 'Half Dozen', '1 pc', '1 litre', '500ml'];

  productForm = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    brand: [''],
    status: ['Active' as ProductStatus, Validators.required],
    imageUrl: [''],
    totalStockGrams: [0, [Validators.required, Validators.min(0)]],
    variants: this.fb.array([])
  });

  isAnyFilterActive = computed(() => {
    return this.searchTerm() !== '' || this.filterStatus() !== 'all';
  });

  // Effect to trigger search when filters change
  constructor(
    public productService: ProductService,
    public categoryService: CategoryService,
    public userService: UserService,
    private fb: FormBuilder
  ) {
    effect(() => {
      const query = this.searchTerm();
      const status = this.filterStatus();
      const pageIndex = this.pageIndex();
      const pageSize = this.pageSize();

      const filters: any = {};
      if (status !== 'all') filters.status = status;

      const timeoutId = setTimeout(() => {
        this.productService.searchProducts({
          query,
          filters,
          pageIndex,
          pageSize
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    });
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  clearAllFilters() {
    this.searchTerm.set('');
    this.filterStatus.set('all');
    this.pageIndex.set(0);
  }

  newVariant(): FormGroup {
    const variantGroup = this.fb.group({
      unit: ['', Validators.required],
      mrp: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]]
    });

    if (!this.userService.hasPermission('editPrices')) {
      variantGroup.get('mrp')?.disable();
      variantGroup.get('sellingPrice')?.disable();
    }

    return variantGroup;
  }

  addVariant() {
    this.variants.push(this.newVariant());
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.editingProductId.set(null);
    this.productForm.reset({ status: 'Active' });
    this.variants.clear();
    this.addVariant();

    if (!this.userService.hasPermission('editStock')) {
      this.productForm.get('totalStockGrams')?.disable();
    } else {
      this.productForm.get('totalStockGrams')?.enable();
    }

    this.showModal.set(true);
  }

  openEditModal(product: Product) {
    if (!this.userService.hasPermission('editProducts')) return;
    this.isEditMode.set(true);
    this.editingProductId.set(product.id);

    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      description: product.description,
      category: product.category,
      brand: product.brand,
      status: product.status,
      imageUrl: product.imageUrl || '',
      totalStockGrams: product.totalStockGrams
    });

    this.variants.clear();
    product.variants.forEach(variant => {
      const vGroup = this.newVariant();
      vGroup.patchValue(variant);
      this.variants.push(vGroup);
    });

    if (!this.userService.hasPermission('editStock')) {
      this.productForm.get('totalStockGrams')?.disable();
    } else {
      this.productForm.get('totalStockGrams')?.enable();
    }

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveProduct() {
    if (this.productForm.invalid) return;

    const formValue = this.productForm.getRawValue();

    if (this.isEditMode() && this.editingProductId()) {
      const updates = {
        ...formValue,
        variants: formValue.variants as ProductVariant[]
      };
      this.productService.updateProduct(this.editingProductId()!, updates as Partial<Product>);
    } else {
      const newProduct: Omit<Product, 'id'> = {
        ...formValue,
        variants: formValue.variants as ProductVariant[],
        tags: [],
        attributes: {}
      };
      this.productService.addProduct(newProduct);
    }
    this.closeModal();
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id);
    }
  }

  onSearchTermChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  onStatusChange(event: Event) {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
    this.pageIndex.set(0);
  }

  onPageChange(page: number) {
    this.pageIndex.set(page);
  }

  getProductPriceRange(product: Product): string {
    if (!product.variants || product.variants.length === 0) {
      return 'N/A';
    }
    const prices = product.variants.map(v => v.sellingPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`;
    }
    return `${minPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${maxPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}