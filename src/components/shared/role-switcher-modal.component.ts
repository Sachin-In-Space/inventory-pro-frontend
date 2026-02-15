import { Component, ChangeDetectionStrategy, signal, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole } from '../../models/inventory.models';
import { UserService } from '../../services/user.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

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
          <p class="text-base text-gray-600">
            You are about to switch your role to 
            <span class="font-bold text-blue-600 text-lg">{{ targetRole() }}</span>.
          </p>
          
          @if (isSimulationMode()) {
            <p class="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 flex items-start">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span><strong>Super User Mode:</strong> You can instantly simulate this role without logging out.</span>
            </p>
          } @else {
             <p class="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-amber-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span><strong>Action Required:</strong> Switching roles will log you out. You must sign in with an account that has the <strong>{{ targetRole() }}</strong> role.</span>
            </p>
          }

          <div class="flex gap-3 mt-6">
            <button (click)="close.emit()" class="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
            </button>
            <button (click)="confirmSwitch()" class="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-black text-white font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                Confirm Switch
            </button>
          </div>
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

  private userService = inject(UserService);
  private authService = inject(FirebaseAuthService);

  // Computed check for simulation mode
  isSimulationMode = computed(() => this.userService.isSuper);

  confirmSwitch() {
    if (this.userService.isSuper) {
      // Super User can simulate instantly
      this.roleAuthenticated.emit(this.targetRole());
      this.close.emit();
    } else {
      // Standard users must logout to switch context
      this.authService.logout();
    }
  }
}
