
import { Component, ChangeDetectionStrategy, signal, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole, User } from '../../../models/inventory.models';
import { UserService } from '../../../services/user.service';
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { debounceTime, distinctUntilChanged, Subject, tap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-card dark:bg-card-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h3 class="text-xl font-semibold text-text-main dark:text-text-dark">Select User to Simulate</h3>
          <button (click)="close.emit()" class="text-text-muted hover:text-text-main dark:hover:text-text-dark">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="p-4 border-b border-border-light dark:border-border-dark">
          <input 
            type="text" 
            [ngModel]="searchTerm()" 
            (ngModelChange)="onSearchTermChange($event)"
            placeholder="Search by name, email, or role..." 
            class="block w-full px-4 py-2 bg-secondary dark:bg-base-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
        </div>

        <!-- User List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2" (scroll)="onScroll($event)">
          @for (user of users(); track user.id) {
            <div class="flex items-center justify-between p-3 rounded-lg hover:bg-secondary dark:hover:bg-base-dark transition-colors border border-transparent hover:border-border-light dark:hover:border-border-dark group">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-text-main dark:text-text-dark">{{ user.name }}</p>
                  <p class="text-xs text-text-muted dark:text-text-muted-dark">{{ user.email }}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {{ user.role }}
                </span>
                
                @if (canSimulate(user)) {
                  <button (click)="simulateUser(user)" 
                    class="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-colors shadow-sm">
                    Simulate
                  </button>
                }
              </div>
            </div>
          } @empty {
             @if (!isLoading()) {
                <div class="text-center py-8 text-text-muted">
                    No users found matching "{{ searchTerm() }}"
                </div>
             }
          }

          @if (isLoading()) {
            <div class="flex justify-center py-4">
               <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListModalComponent implements OnInit {
  users = signal<any[]>([]);
  searchTerm = signal('');
  page = signal(1);
  isLoading = signal(false);
  hasMore = signal(true);

  @Output() close = new EventEmitter<void>();
  @Output() userSelected = new EventEmitter<any>();

  private authService = inject(FirebaseAuthService);
  private userService = inject(UserService);
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounced search
    this.searchSubject.pipe(
      takeUntilDestroyed(),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.page.set(1);
        this.users.set([]);
        this.hasMore.set(true);
        this.fetchUsers();
      })
    ).subscribe();
  }

  ngOnInit() {
    this.fetchUsers();
  }

  onSearchTermChange(term: string) {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  fetchUsers() {
    if (this.isLoading() || !this.hasMore()) return;

    this.isLoading.set(true);
    this.authService.searchUsers(this.searchTerm(), this.page(), 20)
      .pipe(
        tap((res: any) => {
          if (res.success) {
            const newUsers = res.users.map((u: any) => ({
              id: u._id,
              name: u.displayName || u.email.split('@')[0],
              email: u.email,
              role: u.role
            }));

            this.users.update(current => [...current, ...newUsers]);
            this.hasMore.set(this.page() < res.pages);
            this.page.update(p => p + 1);
          }
        }),
        catchError(err => {
          // console.error('Error fetching users:', err); // Optional: keep error log or remove if strict
          return of([]);
        }),
        tap(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
      this.fetchUsers();
    }
  }

  canSimulate(targetUser: any): boolean {
    const currentUser = this.userService.currentUser();
    return currentUser.role === 'Super' || currentUser.role === 'Admin';
  }

  simulateUser(user: any) {
    this.userSelected.emit(user);
    this.close.emit();
  }
}
