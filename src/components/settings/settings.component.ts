import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SettingsComponent {
  newCategoryName = signal('');

  constructor(
    public categoryService: CategoryService,
    private productService: ProductService
  ) { }

  addCategory() {
    this.categoryService.addCategory(this.newCategoryName().trim());
    this.newCategoryName.set('');
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category? This cannot be undone.')) {
      this.categoryService.deleteCategory(id);
    }
  }

  handleBulkUpload(event: any) {
    // This is a mock implementation for the UI.
    // In a real app, you would parse the CSV/Excel file here.
    alert("This is a demo feature. Clicking 'Upload' would process a CSV file and add products in a real application.");

    // As a demonstration, add a few sample products using the new data model.
    this.productService.addProduct({ name: 'Bulk Upload Item 1', sku: 'BLK-001', description: 'Sample from upload', category: 'Electronics', status: 'Active', tags: [], brand: 'BulkBrand', attributes: {}, totalStockGrams: 15000, variants: [{ unit: '1 pc', mrp: 100, sellingPrice: 80 }] });
    this.productService.addProduct({ name: 'Bulk Upload Item 2', sku: 'BLK-002', description: 'Sample from upload', category: 'Apparel', status: 'Active', tags: [], brand: 'BulkBrand', attributes: {}, totalStockGrams: 50000, variants: [{ unit: '1 pc', mrp: 40, sellingPrice: 35 }] });
  }
}