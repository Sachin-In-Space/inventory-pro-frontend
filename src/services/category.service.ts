import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/inventory.models';
import { AuditService } from './audit.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private auditService = inject(AuditService);

  private _categories = signal<Category[]>([]);
  categories = this._categories.asReadonly();

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.http.get<{ success: boolean, data: Category[] }>(`${environment.apiUrl}/categories`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._categories.set(response.data);
          }
        },
        error: (err) => console.error('Failed to load categories', err)
      });
  }

  addCategory(name: string) {
    if (!name) return;

    // Optimistic check (though backend enforces unique)
    if (this._categories().find(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists');
      return;
    }

    this.http.post<{ success: boolean, data: Category }>(`${environment.apiUrl}/categories`, { name })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._categories.update(cats => [...cats, response.data]);
            this.auditService.log('Category Added', `New category "${name}" was created.`, String(response.data.id), name);
          }
        },
        error: (err) => console.error('Failed to add category', err)
      });
  }

  deleteCategory(id: number | string) {
    const categoryToDelete = this._categories().find(c => c.id === id);
    if (!categoryToDelete) return;

    this.http.delete<{ success: boolean }>(`${environment.apiUrl}/categories/${id}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._categories.update(cats => cats.filter(c => c.id !== id));
            this.auditService.log('Category Deleted', `Category "${categoryToDelete.name}" was deleted.`, String(id), categoryToDelete.name);
          }
        },
        error: (err) => console.error('Failed to delete category', err)
      });
  }
}
