
import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/inventory.models';

const PERMISSIONS: Record<UserRole, string[]> = {
  'Admin': ['viewDashboard', 'viewProducts', 'editProducts', 'deleteProducts', 'editPrices', 'editStock', 'viewLogs', 'manageSettings', 'viewOrders', 'manageOrders', 'createOrders', 'viewReports'],
  'InventoryManager': ['viewDashboard', 'viewProducts', 'editProducts', 'editStock', 'viewLogs'],
  'Captain': ['viewDashboard', 'viewProducts', 'viewOrders', 'createOrders'],
  'Delivery': ['viewDashboard', 'viewOrders', 'updateOrderStatus'],
  'Viewer': ['viewDashboard', 'viewProducts'],
  'Super': ['viewDashboard', 'viewProducts', 'editProducts', 'deleteProducts', 'editPrices', 'editStock', 'viewLogs', 'manageSettings', 'viewOrders', 'manageOrders', 'createOrders', 'viewReports']
};

@Injectable({ providedIn: 'root' })
export class UserService {
  // Initialize with a default Admin user, but name can be overwritten by real auth
  private _currentUser = signal<User>({
    name: 'Admin User',
    email: 'admin@localmart.com',
    role: 'Admin',
    permissions: PERMISSIONS['Admin']
  });
  // Track the original user when simulating another user
  private _originalUser = signal<User | null>(null);

  currentUser = this._currentUser.asReadonly();
  originalUser = this._originalUser.asReadonly();

  setUser(role: UserRole) {
    this._currentUser.update(user => ({
      ...user,
      role: role,
      permissions: PERMISSIONS[role] || []
    }));
  }

  // Call this when real login happens to set name/email/role
  setProfile(name: string, role: UserRole, email?: string) {
    this._currentUser.set({
      name: name,
      email: email,
      role: role,
      permissions: PERMISSIONS[role] || []
    });
  }

  enterSimulation(targetUser: any) {
    // Save current identity if not already simulating
    if (!this._originalUser()) {
      this._originalUser.set(this.currentUser());
    }

    // Switch to target user
    this.setProfile(targetUser.name, targetUser.role, targetUser.email);
  }

  exitSimulation() {
    const original = this._originalUser();
    if (original) {
      // Restore original identity
      this._currentUser.set(original);
      this._originalUser.set(null);
    }
  }

  hasPermission(permission: string): boolean {
    return this.currentUser().permissions.includes(permission);
  }

  get isSuper(): boolean {
    return this.currentUser().role === 'Super';
  }

  get isSimulating(): boolean {
    return this._originalUser() !== null;
  }
}
