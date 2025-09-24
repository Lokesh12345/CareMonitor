import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NoAuthGuard } from './no-auth.guard';
import { AuthStore } from '../stores/auth.store';

describe('NoAuthGuard', () => {
  let guard: NoAuthGuard;
  let mockAuthStore: jasmine.SpyObj<AuthStore>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authStoreSpy = jasmine.createSpyObj('AuthStore', [], {
      isAuthenticated$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        NoAuthGuard,
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(NoAuthGuard);
    mockAuthStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when not authenticated', (done) => {
    Object.defineProperty(mockAuthStore, 'isAuthenticated$', {
      value: of(false)
    });

    guard.canActivate().subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should redirect to dashboard when authenticated', (done) => {
    const urlTree = {} as any;
    mockRouter.createUrlTree.and.returnValue(urlTree);

    Object.defineProperty(mockAuthStore, 'isAuthenticated$', {
      value: of(true)
    });

    guard.canActivate().subscribe(result => {
      expect(result).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });
});