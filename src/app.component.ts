
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

  setView(view: View) {
    this.currentView.set(view);
    this.showMobileMoreMenu.set(false);
  }

  toggleMobileMoreMenu() {
    this.showMobileMoreMenu.update(v => !v);
  }

  initiateRoleSwitch(role: UserRole) {
    // If attempting to switch to the same role, do nothing
    if (role === this.currentUser().role) return;

    this.pendingRole.set(role);
    this.showRoleModal.set(true);
    this.showRoleSwitcherMobile.set(false);
  }

  onRoleAuthenticated(role: UserRole) {
    this.userService.setUser(role);
    this.showRoleModal.set(false);

    // Redirect logic after successful switch
    // Redirect if on a view the new role cannot access
    if (this.currentView() === 'settings' && !this.userService.hasPermission('manageSettings')) {
      this.setView('dashboard');
    }
    if (this.currentView() === 'reports' && !this.userService.hasPermission('viewReports')) {
      this.setView('dashboard');
    }
    if (this.currentView() === 'products' && !this.userService.hasPermission('viewProducts')) {
      this.setView('dashboard');
    }
    if (this.currentView() === 'orders' && !this.userService.hasPermission('viewOrders')) {
      this.setView('dashboard');
    }
  }
}