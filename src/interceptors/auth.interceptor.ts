import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, authState, getIdToken } from '@angular/fire/auth';
import { from, switchMap, take } from 'rxjs';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(Auth);

    // Only attach token if calling our backend API
    if (req.url.startsWith(environment.apiUrl)) {
        return authState(auth).pipe(
            take(1),
            switchMap(user => {
                if (user) {
                    return from(getIdToken(user)).pipe(
                        switchMap(token => {
                            const clonedReq = req.clone({
                                headers: req.headers.set('Authorization', `Bearer ${token}`)
                            });
                            return next(clonedReq);
                        })
                    );
                }
                return next(req);
            })
        );
    }

    return next(req);
};
