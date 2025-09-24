import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authStore: AuthStore,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  private checkAuthentication(): Observable<boolean | UrlTree> {
    return this.authStore.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          // Redirect to login page if not authenticated
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}