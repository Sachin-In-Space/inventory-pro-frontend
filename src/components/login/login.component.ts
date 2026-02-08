import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-secondary dark:bg-base-dark font-sans items-center justify-center p-4">
      <div class="w-full max-w-md bg-card dark:bg-card-dark rounded-2xl shadow-2xl p-8 space-y-8 animate-fade-in border border-border-light dark:border-border-dark">
        
        <!-- Logo / Header -->
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-bold text-text-main dark:text-text-dark tracking-tight">
            Inventory<span class="text-primary">Pro</span>
          </h1>
          <p class="text-text-muted dark:text-text-muted-dark font-medium">
            Management System
          </p>
        </div>

        <!-- Illustration (Optional, using CSS shapes or SVG for now) -->
        <div class="flex justify-center py-4">
          <div class="p-4 bg-primary/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>

        <!-- Login Button -->
        <div class="space-y-4">
          <button (click)="login()" 
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-primary/30">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <!-- Google Icon -->
              <svg class="h-5 w-5 text-primary-light group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
            </span>
            Sign in with Google
          </button>
          
          <p class="text-xs text-center text-text-muted dark:text-text-muted-dark mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

      </div>
      
      <!-- Footer Info -->
      <div class="absolute bottom-4 text-xs text-text-muted dark:text-text-muted-dark opacity-50">
        &copy; 2024 InventoryPro Inc.
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(FirebaseAuthService);

  login() {
    this.authService.loginWithGoogle().subscribe();
  }
}
