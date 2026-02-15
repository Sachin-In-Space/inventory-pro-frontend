import { Injectable, inject, signal } from '@angular/core';
import { Auth, user, signInWithPopup, GoogleAuthProvider, signOut, User, getIdToken } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class FirebaseAuthService {
    private auth: Auth = inject(Auth);
    private router: Router = inject(Router);

    // Expose current user as a signal for easy template use
    user = signal<User | null>(null);

    constructor() {
        // Sync Firebase user state with our signal
        user(this.auth).subscribe((u) => {
            this.user.set(u);
            if (u) {
                console.log('User is logged in:');
                this.fetchUserProfile();
            } else {
                console.log('User is logged out');
                // Could reset user to guest/viewer here if needed, but app defaults to Admin currently
            }
        });
    }

    private fetchUserProfile() {
        this.http.get<{ success: boolean, user: any }>(`${environment.apiUrl}/auth/me`)
            .subscribe({
                next: (res) => {
                    if (res.success && res.user) {
                        console.log('Fetched user profile:', res.user);
                        this.userService.setProfile(
                            res.user.displayName || res.user.email,
                            res.user.role
                        );
                    }
                },
                error: (err) => console.error('Failed to fetch user profile', err)
            });
    }

    private http = inject(HttpClient);
    private userService = inject(UserService);

    // Login with Google and sync with backend
    loginWithGoogle(): Observable<void> {
        const provider = new GoogleAuthProvider();
        return from(signInWithPopup(this.auth, provider)).pipe(
            switchMap(() => this.http.post(`${environment.apiUrl}/auth/login`, {})),
            tap((response: any) => {
                if (response.success && response.user) {
                    console.log('Backend login successful', response.user);
                    this.userService.setProfile(
                        response.user.displayName || response.user.email,
                        response.user.role
                    );
                }
            }),
            map(() => void 0),
            catchError((error) => {
                console.error('Login failed', error);
                return of(void 0);
            })
        );
    }

    // Logout
    async logout(): Promise<void> {
        await signOut(this.auth);
        this.router.navigate(['/']);
    }

    // Get ID Token for API requests
    getIdToken(): Observable<string | null> {
        return this.user() ? from(this.user()!.getIdToken()) : of(null);
    }

    searchUsers(query: string, page: number = 1, limit: number = 20): Observable<any> {
        return this.http.get(`${environment.apiUrl}/auth/users/search`, {
            params: { q: query, page: page.toString(), limit: limit.toString() }
        });
    }
}
