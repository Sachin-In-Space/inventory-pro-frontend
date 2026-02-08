
import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole } from '../../models/inventory.models';
import { MongoAuthService } from '../../services/mongo-auth.service';

@Component({
    selector: 'app-role-switcher-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="close.emit()">
      <div class="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden" (click)="$event.stopPropagation()">
        
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="text-lg font-semibold text-gray-900">Switch Role</h3>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-500">
            Please authenticate to switch to the 
            <span class="font-bold text-gray-900 uppercase">{{ targetRole() }}</span> role.
          </p>

          <form (ngSubmit)="login()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" [(ngModel)]="email" name="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" [(ngModel)]="password" name="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required>
            </div>

             <div *ngIf="errorMessage()" class="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {{ errorMessage() }}
             </div>

            <button type="submit" [disabled]="isLoading()" class="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {{ isLoading() ? 'Authenticating...' : 'Confirm Role Switch' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
        display: block;
    }
  `]
})
export class RoleSwitcherModalComponent {
    targetRole = signal<UserRole>('Viewer');
    close = output();
    roleAuthenticated = output<UserRole>();

    email = '';
    password = '';
    isLoading = signal(false);
    errorMessage = signal('');

    constructor(private mongoAuth: MongoAuthService) { }

    async login() {
        this.isLoading.set(true);
        this.errorMessage.set('');

        try {
            await this.mongoAuth.login(this.email, this.password);
            this.roleAuthenticated.emit(this.targetRole());
            this.close.emit();
        } catch (err: unknown) {
            this.errorMessage.set('Invalid credentials. Please try again.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
