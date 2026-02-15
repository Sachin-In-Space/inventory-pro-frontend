import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-text-main dark:text-text-dark">Settings</h2>

      <!-- Categories Management -->
      <div class="bg-card dark:bg-card-dark shadow-sm rounded-xl p-6 border border-border-light dark:border-border-dark">
        <h3 class="text-lg font-semibold text-text-main dark:text-text-dark mb-4">Product Categories</h3>
        
        <div class="flex gap-2 mb-4">
          <input 
            type="text" 
            [(ngModel)]="newCategoryName" 
            placeholder="New Category Name"
            class="block w-full px-4 py-2 bg-card dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            (keyup.enter)="addCategory()"
          >
          <button 
            (click)="addCategory()"
            class="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75 transition-colors whitespace-nowrap"
            [disabled]="!newCategoryName.trim()">
            Add
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          @for(category of categoryService.categories(); track category.id) {
            <div class="flex justify-between items-center p-3 bg-secondary dark:bg-base-dark rounded-lg group border border-transparent hover:border-border-light dark:hover:border-border-dark transition-all">
              <span class="text-text-main dark:text-text-dark">{{ category.name }}</span>
              <button 
                (click)="deleteCategory(category.id)"
                class="text-text-muted hover:text-red-500 transition-colors p-1"
                title="Remove category">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Bulk Upload Placeholder -->
      <div class="bg-card dark:bg-card-dark shadow-sm rounded-xl p-6 border border-border-light dark:border-border-dark">
         <h3 class="text-lg font-semibold text-text-main dark:text-text-dark mb-4">Bulk Data Import</h3>
         <p class="text-text-muted dark:text-text-muted-dark mb-4 text-sm">Upload CSV/Excel files to bulk import products.</p>
         
         <div class="border-2 border-dashed border-border-light dark:border-border-dark rounded-xl p-8 text-center hover:bg-secondary dark:hover:bg-base-dark transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="mt-2 text-sm text-text-muted">Click to upload or drag and drop</p>
         </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  newCategoryName: string = '';

  constructor(
    public categoryService: CategoryService,
    private productService: ProductService
  ) { }

  addCategory() {
    this.categoryService.addCategory(this.newCategoryName.trim());
    this.newCategoryName = '';
  }

  deleteCategory(id: string) {
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