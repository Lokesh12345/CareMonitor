import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, EMPTY } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthState, User, LoginCredentials } from '../interfaces/auth.interfaces';
import { AuthService } from '../services/auth.service';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class AuthStore extends ComponentStore<AuthState> {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    super(initialState);
    this.initializeAuthState();
  }

  // Selectors
  readonly user$ = this.select(state => state.user);
  readonly isAuthenticated$ = this.select(state => state.isAuthenticated);
  readonly isLoading$ = this.select(state => state.isLoading);
  readonly error$ = this.select(state => state.error);

  // Computed selectors
  readonly authState$ = this.select({
    user: this.user$,
    isAuthenticated: this.isAuthenticated$,
    isLoading: this.isLoading$,
    error: this.error$
  });

  readonly userEmail$ = this.select(
    this.user$,
    user => user?.email || ''
  );

  // Updaters
  readonly setLoading = this.updater((state, isLoading: boolean) => ({
    ...state,
    isLoading,
    error: isLoading ? null : state.error
  }));

  readonly setUser = this.updater((state, user: User) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null
  }));

  readonly setError = this.updater((state, error: string) => ({
    ...state,
    error,
    isLoading: false
  }));

  readonly clearAuth = this.updater((state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }));

  readonly clearError = this.updater((state) => ({
    ...state,
    error: null
  }));

  // Effects
  readonly login = this.effect((credentials$: Observable<LoginCredentials>) =>
    credentials$.pipe(
      tap(() => this.setLoading(true)),
      switchMap(credentials =>
        this.authService.login(credentials).pipe(
          tap((user: User) => {
            this.setUser(user);
          }),
          catchError((error: any) => {
            const errorMessage = error?.message || 'Login failed';
            this.setError(errorMessage);
            return EMPTY;
          })
        )
      )
    )
  );

  readonly logout = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => {
        this.authService.logout();
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      switchMap(() => EMPTY)
    )
  );

  readonly checkAuthStatus = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => {
        const user = this.authService.getCurrentUser();
        const isAuthenticated = this.authService.isAuthenticated();

        if (user && isAuthenticated) {
          this.setUser(user);
        } else {
          this.clearAuth();
        }
      }),
      switchMap(() => EMPTY)
    )
  );

  readonly refreshSession = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => {
        if (this.authService.isSessionValid()) {
          this.authService.refreshSession();
        } else {
          this.authService.logout();
          this.clearAuth();
          this.router.navigate(['/login']);
        }
      }),
      switchMap(() => EMPTY)
    )
  );

  // Initialize authentication state from cookies on app start
  private initializeAuthState(): void {
    const user = this.authService.getCurrentUser();
    const isAuthenticated = this.authService.isAuthenticated();

    if (user && isAuthenticated && this.authService.isSessionValid()) {
      this.setUser(user);
    } else {
      this.clearAuth();
      // Clear invalid session data
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // Helper methods for components
  getCurrentUser(): User | null {
    return this.get().user;
  }

  isUserAuthenticated(): boolean {
    return this.get().isAuthenticated;
  }

  getUserEmail(): string {
    return this.get().user?.email || '';
  }
}