
import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/inventory.models';

const ROLES: Record<UserRole, User> = {
    'Admin': {
        name: 'Alice (Admin)',
        role: 'Admin',
        permissions: ['viewDashboard', 'viewProducts', 'editProducts', 'deleteProducts', 'editPrices', 'editStock', 'viewLogs', 'manageSettings', 'viewOrders', 'manageOrders', 'viewReports'],
    },
    'InventoryManager': {
        name: 'Bob (Manager)',
        role: 'InventoryManager',
        permissions: ['viewDashboard', 'viewProducts', 'editProducts', 'editStock', 'viewLogs'],
    },
     'Captain': {
        name: 'Dave (Captain)',
        role: 'Captain',
        permissions: ['viewDashboard', 'viewProducts', 'viewOrders', 'createOrders'],
    },
    'Delivery': {
        name: 'Eve (Delivery)',
        role: 'Delivery',
        permissions: ['viewDashboard', 'viewOrders', 'updateOrderStatus'],
    },
    'Viewer': {
        name: 'Charlie (Viewer)',
        role: 'Viewer',
        permissions: ['viewDashboard', 'viewProducts'],
    }
};

@Injectable({ providedIn: 'root' })
export class UserService {
  private _currentUser = signal<User>(ROLES['Admin']);
  currentUser = this._currentUser.asReadonly();

  setUser(role: UserRole) {
    this._currentUser.set(ROLES[role]);
  }
  
  hasPermission(permission: string): boolean {
    return this.currentUser().permissions.includes(permission);
  }
}
