import { TestBed } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { MockApiService } from './mock-api.service';
import { LoginCredentials } from '../interfaces/auth.interfaces';

describe('AuthService', () => {
  let service: AuthService;
  let mockCookieService: jasmine.SpyObj<CookieService>;
  let mockApiService: jasmine.SpyObj<MockApiService>;

  beforeEach(() => {
    const cookieSpy = jasmine.createSpyObj('CookieService', ['get', 'set', 'delete']);
    const apiSpy = jasmine.createSpyObj('MockApiService', ['login']);

    TestBed.configureTestingModule({
      providers: [
        { provide: CookieService, useValue: cookieSpy },
        { provide: MockApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    mockCookieService = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    mockApiService = TestBed.inject(MockApiService) as jasmine.SpyObj<MockApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully and store user data', (done) => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockResponse = {
      status: 'success' as const,
      data: {
        token: 'mock-token-123',
        user: { email: 'test@example.com' }
      }
    };

    mockApiService.login.and.returnValue(of(mockResponse));

    service.login(credentials).subscribe({
      next: (user) => {
        expect(user.email).toBe('test@example.com');
        expect(user.token).toBe('mock-token-123');
        expect(mockCookieService.set).toHaveBeenCalledTimes(2);
        done();
      },
      error: done.fail
    });
  });

  it('should handle login error and clear user data', (done) => {
    const credentials: LoginCredentials = {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    };

    const mockError = {
      status: 'error',
      message: 'Invalid credentials'
    };

    mockApiService.login.and.returnValue(throwError(() => mockError));

    service.login(credentials).subscribe({
      next: () => done.fail('Should have failed'),
      error: (error) => {
        expect(mockCookieService.delete).toHaveBeenCalledTimes(2);
        done();
      }
    });
  });

  it('should logout and clear user data', () => {
    service.logout();
    expect(mockCookieService.delete).toHaveBeenCalledWith('care_monitor_token', '/');
    expect(mockCookieService.delete).toHaveBeenCalledWith('care_monitor_user', '/');
  });

  it('should check authentication status', () => {
    mockCookieService.get.and.returnValues('mock-token', '{"email":"test@example.com"}');
    expect(service.isAuthenticated()).toBe(true);

    mockCookieService.get.and.returnValues('', '');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should get current user from cookies', () => {
    mockCookieService.get.and.callFake((key: string) => {
      if (key === 'care_monitor_user') return '{"email":"test@example.com"}';
      if (key === 'care_monitor_token') return 'mock-token';
      return '';
    });

    const user = service.getCurrentUser();
    expect(user).toEqual({
      email: 'test@example.com',
      token: 'mock-token'
    });
  });

  it('should return null for invalid user data', () => {
    const consoleSpy = spyOn(console, 'error');
    mockCookieService.get.and.returnValue('invalid-json');
    const user = service.getCurrentUser();
    expect(user).toBeNull();
    expect(mockCookieService.delete).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalled();
  });
});