import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ListComponent } from './list.component';
import { AuthStore } from '../../core/stores/auth.store';
import { MockApiService } from '../../core/services/mock-api.service';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthStore: jasmine.SpyObj<AuthStore>;
  let mockApiService: jasmine.SpyObj<MockApiService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authStoreSpy = jasmine.createSpyObj('AuthStore', ['checkAuthStatus', 'logout'], {
      userEmail$: of('test@example.com'),
      isAuthenticated$: of(true)
    });
    const apiServiceSpy = jasmine.createSpyObj('MockApiService', ['getItems', 'deleteItem', 'createItem', 'updateItem']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    apiServiceSpy.getItems.and.returnValue(of({
      status: 'success',
      data: [
        { id: 1, name: 'Test Item', description: 'Test Description' }
      ],
      message: 'Success'
    }));

    await TestBed.configureTestingModule({
      imports: [
        ListComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: MockApiService, useValue: apiServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockAuthStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    mockApiService = TestBed.inject(MockApiService) as jasmine.SpyObj<MockApiService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check auth status on init', () => {
    expect(mockAuthStore.checkAuthStatus).toHaveBeenCalled();
  });

  it('should load items on init', () => {
    expect(mockApiService.getItems).toHaveBeenCalled();
    expect(component.items.length).toBeGreaterThan(0);
  });

  it('should navigate back to dashboard', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should call logout on auth store', () => {
    component.logout();
    expect(mockAuthStore.logout).toHaveBeenCalled();
  });

  it('should refresh items', () => {
    mockApiService.getItems.calls.reset();
    component.refreshItems();
    expect(mockApiService.getItems).toHaveBeenCalled();
  });

  it('should filter items based on search term', () => {
    component.items = [
      { id: 1, name: 'Patient Record', description: 'Test' },
      { id: 2, name: 'Equipment Check', description: 'Test' }
    ];
    component.searchTerm = 'Patient';
    component.onSearchChange();
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].name).toBe('Patient Record');
  });
});