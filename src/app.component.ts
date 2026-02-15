
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './components/login/login.component';


import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductsComponent } from './components/products/products.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { OrdersComponent } from './components/orders/orders.component';
import { ReportsComponent } from './components/reports/reports.component';
import { UserService } from './services/user.service';
import { UserRole } from './models/inventory.models';

type View = 'dashboard' | 'products' | 'orders' | 'logs' | 'reports' | 'settings';

import { RoleSwitcherModalComponent } from './components/shared/role-switcher-modal.component';
import { UserListModalComponent } from './components/shared/user-list-modal/user-list-modal.component';

import { FirebaseAuthService } from './services/firebase-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    ProductsComponent,
    SettingsComponent,
    AuditLogComponent,
    OrdersComponent,
    ReportsComponent,
    RoleSwitcherModalComponent,
    UserListModalComponent,
    FormsModule,
    LoginComponent
  ],
})
export class AppComponent {
  currentView = signal<View>('dashboard');
  showRoleSwitcherMobile = signal(false);
  showMobileMoreMenu = signal(false);

  // Role Switcher Modal State
  showRoleModal = signal(false);
  pendingRole = signal<UserRole>('Viewer');

  constructor(public userService: UserService, public authService: FirebaseAuthService) { }

  login() {
    this.authService.loginWithGoogle();
  }

  logout() {
    this.authService.logout();
  }

  isMoreViewActive = computed(() => {
    const current = this.currentView();
    return current === 'reports' || current === 'logs' || current === 'settings';
  });

  shouldShowMoreTab = computed(() => {
    return this.userService.hasPermission('viewReports') ||
      this.userService.hasPermission('viewLogs') ||
      this.userService.hasPermission('manageSettings');
  });

  get currentUser() {
    return this.userService.currentUser;
  }

  // Snackbar State
  snackbarMessage = signal<string | null>(null);

  showSnackbar(message: string) {
    this.snackbarMessage.set(message);
    setTimeout(() => this.snackbarMessage.set(null), 3000);
  }

  // Permission Check Helper for Template
  checkPermission(permission: string): boolean {
    return this.userService.hasPermission(permission);
  }

  // Intercept setView to check permissions
  setView(view: View) {
    // Check permission before switching
    let hasAccess = true;
    switch (view) {
      case 'products': hasAccess = this.checkPermission('viewProducts'); break;
      case 'orders': hasAccess = this.checkPermission('viewOrders'); break;
      case 'reports': hasAccess = this.checkPermission('viewReports'); break;
      case 'logs': hasAccess = this.checkPermission('viewLogs'); break;
      case 'settings': hasAccess = this.checkPermission('manageSettings'); break;
    }

    if (!hasAccess) {
      this.showSnackbar('Not Authorized: You do not have permission to access this page.');
      return;
    }

    this.currentView.set(view);
    this.showMobileMoreMenu.set(false);
  }

  toggleMobileMoreMenu() {
    this.showMobileMoreMenu.update(v => !v);
  }

  // User List / Role Switch
  showUserListModal = signal(false);

  initiateRoleSwitch(role?: UserRole) { // Argument is now optional or unused if triggered by button
    // For now, if role is passed (from dropdown), we ignore it if we want to show the list.
    // If the user is Super or Admin, we show the User List.
    if (this.userService.isSuper || this.userService.currentUser().role === 'Admin') {
      this.showUserListModal.set(true);
      this.showRoleModal.set(false);
    } else {
      // Standard users might not have access to switch, or just logout? 
      // For this requirement, we are replacing the switcher. 
      // If a standard user tries to switch, we can just logout or show a message.
      // Assuming we keep the dropdown for standard users to trigger "Logout" via the old modal?
      // Or better yet, we just open the User List but maybe they can't search?
      // Requirement: "Admin user can search by email". 
      // Let's assume standard users don't see the switcher at all? 
      // But let's keep the old behavior for "Simulate" via dropdown if needed?
      // Actually, request says "Remove role switcher component with a component that will list all users".
      this.showUserListModal.set(true);
    }
    this.showRoleSwitcherMobile.set(false);
  }

  onUserSelected(user: any) {
    // Determine target role from selected user
    const targetRole = user.role as UserRole;

    // Use enterSimulation to track original identity
    this.userService.enterSimulation({
      name: user.name,
      role: targetRole,
      permissions: [] // Permissions are auto-set by setProfile/setUser inside service
    });

    this.showUserListModal.set(false);

    this.showSnackbar(`Simulating user ${user.name} (${targetRole})`);

    // Redirect logic
    const current = this.currentView();
    if (
      (current === 'settings' && !this.checkPermission('manageSettings')) ||
      (current === 'reports' && !this.checkPermission('viewReports')) ||
      (current === 'products' && !this.checkPermission('viewProducts')) ||
      (current === 'orders' && !this.checkPermission('viewOrders')) ||
      (current === 'logs' && !this.checkPermission('viewLogs'))
    ) {
      this.setView('dashboard');
    }
  }

  exitSimulation() {
    this.userService.exitSimulation();
    this.showSnackbar('Exited simulation. Welcome back!');
    // Redirect to dashboard to be safe
    this.setView('dashboard');
  }

  // Keep old method for backward compatibility if needed, but updated to use new modal if appropriate
  // onRoleAuthenticated is for the OLD modal. We will remove the old modal from template.
  onRoleAuthenticated(role: UserRole) {
    // If attempting to switch to the same role, do nothing
    if (role === this.currentUser().role) return;

    this.pendingRole.set(role);
    this.showRoleModal.set(true);
    this.showRoleSwitcherMobile.set(false);
  }
}