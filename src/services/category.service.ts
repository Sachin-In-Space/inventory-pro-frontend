
import { Injectable, signal } from '@angular/core';
import { Category } from '../models/inventory.models';
import { AuditService } from './audit.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private _categories = signal<Category[]>([]);
  categories = this._categories.asReadonly();

  constructor(private auditService: AuditService) {
    this._categories.set([
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Books' },
      { id: 3, name: 'Apparel' },
      { id: 4, name: 'Homeware' },
      { id: 5, name: 'Groceries' },
    ]);
  }

  addCategory(name: string) {
    if (name && !this._categories().find(c => c.name.toLowerCase() === name.toLowerCase())) {
      const newCategory: Category = { id: Date.now(), name };
      this._categories.update(cats => [...cats, newCategory]);
      this.auditService.log('Category Added', `New category "${name}" was created.`);
    }
  }

  deleteCategory(id: number) {
    const categoryToDelete = this._categories().find(c => c.id === id);
    if (categoryToDelete) {
        this._categories.update(cats => cats.filter(c => c.id !== id));
        this.auditService.log('Category Deleted', `Category "${categoryToDelete.name}" was deleted.`);
    }
  }
}
