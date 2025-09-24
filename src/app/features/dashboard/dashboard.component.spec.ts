import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthStore } from '../../core/stores/auth.store';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthStore: jasmine.SpyObj<AuthStore>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authStoreSpy = jasmine.createSpyObj('AuthStore', ['checkAuthStatus', 'logout', 'refreshSession'], {
      user$: of({ email: 'test@example.com' }),
      userEmail$: of('test@example.com'),
      isAuthenticated$: of(true)
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockAuthStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check auth status on init', () => {
    expect(mockAuthStore.checkAuthStatus).toHaveBeenCalled();
  });

  it('should navigate to list page', () => {
    component.navigateToList();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/list']);
  });

  it('should call logout on auth store', () => {
    component.logout();
    expect(mockAuthStore.logout).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should have dashboard stats', () => {
    expect(component.dashboardStats).toBeDefined();
    expect(component.dashboardStats.totalPatients).toBe(5);
    expect(component.dashboardStats.totalEquipment).toBe(3);
  });

  it('should have recent activities', () => {
    expect(component.recentActivities).toBeDefined();
    expect(component.recentActivities.length).toBeGreaterThan(0);
  });
});