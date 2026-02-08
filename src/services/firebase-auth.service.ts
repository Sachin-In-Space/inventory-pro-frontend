import { Injectable, inject, signal } from '@angular/core';
import { Auth, user, signInWithPopup, GoogleAuthProvider, signOut, User, getIdToken } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../environments/environment';

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
                console.log('User is logged in:', u.email);
            } else {
                console.log('User is logged out');
            }
        });
    }

    private http = inject(HttpClient);

    // Login with Google and sync with backend
    loginWithGoogle(): Observable<void> {
        const provider = new GoogleAuthProvider();
        return from(signInWithPopup(this.auth, provider)).pipe(
            switchMap(() => this.http.post(`${environment.apiUrl}/auth/login`, {})),
            tap((response: any) => console.log('Backend login successful', response)),
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
    async getIdToken(): Promise<string | null> {
        const u = this.auth.currentUser;
        if (u) {
            return getIdToken(u);
        }
        return null;
    }
}
