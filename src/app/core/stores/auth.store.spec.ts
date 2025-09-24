import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { User, LoginCredentials } from '../interfaces/auth.interfaces';

describe('AuthStore', () => {
  let store: AuthStore;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'logout',
      'getCurrentUser',
      'isAuthenticated',
      'isSessionValid',
      'refreshSession'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    store = TestBed.inject(AuthStore);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default mock responses
    mockAuthService.getCurrentUser.and.returnValue(null);
    mockAuthService.isAuthenticated.and.returnValue(false);
    mockAuthService.isSessionValid.and.returnValue(false);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with default state', () => {
    store.authState$.subscribe(state => {
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  it('should handle successful login', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const user: User = {
      email: 'test@example.com',
      token: 'mock-token'
    };

    mockAuthService.login.and.returnValue(of(user));

    store.login(credentials);

    store.authState$.subscribe(state => {
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  it('should handle login error', () => {
    const credentials: LoginCredentials = {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    };

    const error = { message: 'Invalid credentials' };
    mockAuthService.login.and.returnValue(throwError(() => error));

    store.login(credentials);

    store.authState$.subscribe(state => {
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  it('should handle logout', () => {
    // First set a user
    const user: User = { email: 'test@example.com', token: 'token' };
    store.setUser(user);

    // Then logout
    store.logout();

    store.authState$.subscribe(state => {
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should check auth status and set user if valid', () => {
    const user: User = { email: 'test@example.com', token: 'token' };
    mockAuthService.getCurrentUser.and.returnValue(user);
    mockAuthService.isAuthenticated.and.returnValue(true);

    store.checkAuthStatus();

    store.authState$.subscribe(state => {
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  it('should clear auth if user is not authenticated', () => {
    mockAuthService.getCurrentUser.and.returnValue(null);
    mockAuthService.isAuthenticated.and.returnValue(false);

    store.checkAuthStatus();

    store.authState$.subscribe(state => {
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  it('should refresh session if valid', () => {
    mockAuthService.isSessionValid.and.returnValue(true);

    store.refreshSession();

    expect(mockAuthService.refreshSession).toHaveBeenCalled();
  });

  it('should logout if session is invalid during refresh', () => {
    mockAuthService.isSessionValid.and.returnValue(false);

    store.refreshSession();

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should provide helper methods', () => {
    const user: User = { email: 'test@example.com', token: 'token' };
    store.setUser(user);

    expect(store.getCurrentUser()).toEqual(user);
    expect(store.isUserAuthenticated()).toBe(true);
    expect(store.getUserEmail()).toBe('test@example.com');
  });

  it('should handle error clearing', (done) => {
    store.setError('Some error');

    let callCount = 0;
    store.error$.subscribe(error => {
      callCount++;
      if (callCount === 1) {
        expect(error).toBe('Some error');
        store.clearError();
      } else if (callCount === 2) {
        expect(error).toBeNull();
        done();
      }
    });
  });
});