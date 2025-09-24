import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthStore } from '../../../core/stores/auth.store';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthStore: jasmine.SpyObj<AuthStore>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authStoreSpy = jasmine.createSpyObj('AuthStore', ['login', 'clearError'], {
      isLoading$: of(false),
      error$: of(null),
      isAuthenticated$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: authStoreSpy }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockAuthStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate form with empty fields', () => {
    component.loginForm.reset();
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should validate email field', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate password field', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();

    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBeFalsy();
  });

  it('should fill demo credentials', () => {
    component.fillDemoCredentials();
    expect(component.loginForm.get('email')?.value).toBe('admin@caremonitor.com');
    expect(component.loginForm.get('password')?.value).toBe('password123');
  });

  it('should call login on form submit', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    component.onSubmit();
    expect(mockAuthStore.login).toHaveBeenCalled();
  });
});