import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { MockApiService } from './mock-api.service';
import { LoginCredentials, User } from '../interfaces/auth.interfaces';
import { LoginRequest } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'care_monitor_token';
  private readonly USER_KEY = 'care_monitor_user';
  private readonly COOKIE_EXPIRY_DAYS = 7;

  constructor(
    private cookieService: CookieService,
    private mockApiService: MockApiService
  ) {}

  /**
   * Login user and store authentication data in cookies
   */
  login(credentials: LoginCredentials): Observable<User> {
    const loginRequest: LoginRequest = {
      email: credentials.email,
      password: credentials.password
    };

    return this.mockApiService.login(loginRequest).pipe(
      map(response => {
        if (response.status === 'success') {
          return {
            email: response.data.user.email,
            token: response.data.token
          };
        }
        throw new Error(response.message || 'Login failed');
      }),
      tap(user => {
        this.storeUserData(user);
      }),
      catchError(error => {
        this.clearUserData();
        throw error;
      })
    );
  }

  /**
   * Logout user and clear authentication data
   */
  logout(): void {
    this.clearUserData();
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Get current user from cookies
   */
  getCurrentUser(): User | null {
    return this.getUser();
  }

  /**
   * Get authentication token from cookies
   */
  getToken(): string | null {
    return this.cookieService.get(this.TOKEN_KEY) || null;
  }

  /**
   * Store user data in cookies
   */
  private storeUserData(user: User): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + this.COOKIE_EXPIRY_DAYS);

    const cookieOptions = {
      expires: expires,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'Strict' as const,
      path: '/'
    };

    if (user.token) {
      this.cookieService.set(this.TOKEN_KEY, user.token, cookieOptions);
    }

    const userData = {
      email: user.email
    };

    this.cookieService.set(this.USER_KEY, JSON.stringify(userData), cookieOptions);
  }

  /**
   * Get user data from cookies
   */
  private getUser(): User | null {
    try {
      const userJson = this.cookieService.get(this.USER_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        return {
          email: userData.email,
          token: this.getToken() || undefined
        };
      }
    } catch (error) {
      console.error('Error parsing user data from cookies:', error);
      this.clearUserData();
    }
    return null;
  }

  /**
   * Clear all authentication data from cookies
   */
  private clearUserData(): void {
    this.cookieService.delete(this.TOKEN_KEY, '/');
    this.cookieService.delete(this.USER_KEY, '/');
  }

  /**
   * Check if user session is still valid
   */
  isSessionValid(): boolean {
    const user = this.getCurrentUser();
    const token = this.getToken();

    if (!user || !token) {
      return false;
    }

    // In a real app, you would validate the token with the server
    // For now, we'll just check if the token exists and is not expired
    try {
      // Simple token validation (in real app, decode JWT and check expiry)
      const tokenData = token.split('-');
      if (tokenData.length >= 3) {
        const timestamp = parseInt(tokenData[tokenData.length - 1]);
        const now = Date.now();
        const tokenAge = now - timestamp;
        const maxAge = this.COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        return tokenAge < maxAge;
      }
    } catch (error) {
      console.error('Error validating token:', error);
    }

    return false;
  }

  /**
   * Refresh user session (extend token expiry)
   */
  refreshSession(): void {
    const user = this.getCurrentUser();
    if (user && this.isSessionValid()) {
      this.storeUserData(user);
    }
  }
}