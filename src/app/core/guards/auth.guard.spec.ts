import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthStore } from '../stores/auth.store';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthStore: jasmine.SpyObj<AuthStore>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authStoreSpy = jasmine.createSpyObj('AuthStore', [], {
      isAuthenticated$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    mockAuthStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when authenticated', (done) => {
    Object.defineProperty(mockAuthStore, 'isAuthenticated$', {
      value: of(true)
    });

    guard.canActivate().subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should redirect to login when not authenticated', (done) => {
    const urlTree = {} as any;
    mockRouter.createUrlTree.and.returnValue(urlTree);

    Object.defineProperty(mockAuthStore, 'isAuthenticated$', {
      value: of(false)
    });

    guard.canActivate().subscribe(result => {
      expect(result).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should work for canActivateChild', (done) => {
    Object.defineProperty(mockAuthStore, 'isAuthenticated$', {
      value: of(true)
    });

    guard.canActivateChild().subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });
});