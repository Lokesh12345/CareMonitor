import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private authStore: AuthStore,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authStore.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          // Allow access to login page if not authenticated
          return true;
        } else {
          // Redirect to dashboard if already authenticated
          return this.router.createUrlTree(['/dashboard']);
        }
      })
    );
  }
}