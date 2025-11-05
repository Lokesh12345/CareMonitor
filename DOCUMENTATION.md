# CareMonitor - Technical Documentation

## Table of Contents
1. [Core Services](#core-services)
2. [State Management](#state-management)
3. [Route Guards](#route-guards)
4. [Components](#components)
5. [Interfaces](#interfaces)
6. [RxJS Implementation](#rxjs-implementation)

---

## Core Services

### 1. AuthService (`src/app/core/services/auth.service.ts`)

**Purpose:** Handles all authentication-related operations including login, logout, session management, and cookie storage.

**How It Works:**
- Uses `ngx-cookie-service` to store authentication data in browser cookies
- Communicates with `MockApiService` to simulate backend authentication
- Manages user session with 7-day expiry
- Validates tokens and checks session validity

**Key Methods:**

```typescript
login(credentials: LoginCredentials): Observable<User>
```
- Takes email/password, calls Mock API
- Returns Observable that emits User object
- Stores user data and token in cookies on success
- Uses RxJS `map()` to transform API response to User object
- Uses RxJS `tap()` to trigger side effect (store user data)
- Uses RxJS `catchError()` to handle errors and clear cookies

```typescript
logout(): void
```
- Clears all authentication cookies
- Synchronous operation (no observables needed)

```typescript
isAuthenticated(): boolean
```
- Checks if both token and user data exist in cookies
- Returns boolean, used by route guards

**RxJS Implementation:**
```typescript
return this.mockApiService.login(loginRequest).pipe(
  map(response => ({
    email: response.data.user.email,
    token: response.data.token
  })),
  tap(user => this.storeUserData(user)),
  catchError(error => {
    this.clearUserData();
    throw error;
  })
);
```

**Cookie Management:**
- Token stored in `care_monitor_token` cookie
- User data stored in `care_monitor_user` cookie (JSON stringified)
- Cookies have 7-day expiration, SameSite=Strict for security

---

### 2. MockApiService (`src/app/core/services/mock-api.service.ts`)

**Purpose:** Simulates a real backend API for development and demo purposes.

**How It Works:**
- Stores data in-memory (resets on page refresh)
- Returns RxJS Observables to mimic async HTTP calls
- Adds 1-second delay using `delay()` operator to simulate network latency
- Provides full CRUD operations for list items

**Mock Data Structure:**
```typescript
private mockItems: ListItem[] = [
  { id: 1, name: 'Patient Record #001', description: '...' },
  // ... more items
];
```

**Key Methods:**

```typescript
login(request: LoginRequest): Observable<ApiResponse<LoginResponse>>
```
- Validates credentials (admin@caremonitor.com / password123)
- Returns Observable with success/error response
- Uses `delay(1000)` to simulate network delay
- Uses `throwError()` for invalid credentials

```typescript
getItems(): Observable<ApiResponse<ListItem[]>>
```
- Returns all items wrapped in ApiResponse
- Uses `of()` to create Observable from array
- Uses `delay()` to simulate network latency

```typescript
createItem(item: Omit<ListItem, 'id'>): Observable<ApiResponse<ListItem>>
```
- Generates new ID using `Math.max(...ids) + 1`
- Adds item to in-memory array
- Returns created item in Observable

**RxJS Implementation:**
```typescript
// Success response
return of(response).pipe(delay(this.MOCK_DELAY));

// Error response
return throwError(() => ({
  status: 'error',
  message: 'Invalid credentials'
})).pipe(delay(this.MOCK_DELAY));
```

---

## State Management

### AuthStore (`src/app/core/stores/auth.store.ts`)

**Purpose:** Centralized state management for authentication using NgRx Component Store.

**How It Works:**
- Extends `ComponentStore<AuthState>` for reactive state management
- Provides selectors for accessing state (observables)
- Provides updaters for modifying state (synchronous)
- Provides effects for async operations (side effects)
- Integrates with Router for navigation after auth actions

**State Structure:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Selectors (Read State):**
```typescript
readonly user$ = this.select(state => state.user);
readonly isAuthenticated$ = this.select(state => state.isAuthenticated);
readonly userEmail$ = this.select(this.user$, user => user?.email || '');
```
- Return Observables that emit when state changes
- Components subscribe to these to get reactive updates
- `userEmail$` demonstrates computed selector using `select()` with projection function

**Updaters (Modify State):**
```typescript
readonly setUser = this.updater((state, user: User) => ({
  ...state,
  user,
  isAuthenticated: true,
  isLoading: false,
  error: null
}));
```
- Pure functions that take current state and return new state
- Immutable updates (spread operator creates new object)
- Synchronous operations

**Effects (Side Effects):**
```typescript
readonly login = this.effect((credentials$: Observable<LoginCredentials>) =>
  credentials$.pipe(
    tap(() => this.setLoading(true)),
    switchMap(credentials =>
      this.authService.login(credentials).pipe(
        tap((user: User) => this.setUser(user)),
        catchError((error: any) => {
          this.setError(error?.message || 'Login failed');
          return EMPTY;
        })
      )
    )
  )
);
```

**RxJS Patterns Used:**

1. **switchMap** - Cancels previous login attempts if new one starts
2. **tap** - Triggers side effects (set loading, update state)
3. **catchError** - Handles errors and updates error state
4. **EMPTY** - Completes the observable chain gracefully

**Effect Triggers:**
```typescript
// In component
this.authStore.login({ email, password });

// Internally creates Observable and processes it
```

**Navigation After Auth:**
```typescript
readonly logout = this.effect((trigger$: Observable<void>) =>
  trigger$.pipe(
    tap(() => {
      this.authService.logout();
      this.clearAuth();
      this.router.navigate(['/login']);  // Side effect: navigation
    }),
    switchMap(() => EMPTY)
  )
);
```

**Initialization:**
- Checks cookies on app start
- Restores session if valid token exists
- Clears invalid sessions automatically

---

## Route Guards

### 1. AuthGuard (`src/app/core/guards/auth.guard.ts`)

**Purpose:** Protects routes that require authentication (dashboard, list).

**How It Works:**
```typescript
canActivate(): Observable<boolean | UrlTree> {
  return this.authStore.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;  // Allow access
      }
      return this.router.createUrlTree(['/login']);  // Redirect
    })
  );
}
```

**RxJS Implementation:**
- Returns Observable<boolean | UrlTree>
- Angular Router subscribes to this automatically
- Uses `map()` to transform isAuthenticated boolean to navigation result
- `UrlTree` tells router to redirect to login

**Usage in Routes:**
```typescript
{
  path: 'dashboard',
  canActivate: [AuthGuard],
  loadComponent: () => import('./features/dashboard/...')
}
```

---

### 2. NoAuthGuard (`src/app/core/guards/no-auth.guard.ts`)

**Purpose:** Prevents authenticated users from accessing login page.

**How It Works:**
```typescript
canActivate(): Observable<boolean | UrlTree> {
  return this.authStore.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;  // Allow access to login
      }
      return this.router.createUrlTree(['/dashboard']);  // Redirect
    })
  );
}
```

**Logic:** Opposite of AuthGuard - allows access only if NOT authenticated.

---

## Components

### 1. Login Component (`src/app/features/auth/login/login.component.ts`)

**Purpose:** Login form with validation and authentication.

**Key Features:**
- Reactive forms with validators
- Real-time form validation
- Loading state during login
- Error display from store
- Demo credentials auto-fill

**Reactive Form Setup:**
```typescript
this.loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]]
});
```

**RxJS Usage:**
```typescript
// Observables for reactive UI
isLoading$ = this.authStore.isLoading$;
error$ = this.authStore.error$;
isAuthenticated$ = this.authStore.isAuthenticated$;

// Template uses async pipe
<span *ngIf="!(isLoading$ | async)">Sign In</span>
```

**Login Flow:**
```typescript
onSubmit() {
  if (this.loginForm.valid) {
    const { email, password } = this.loginForm.value;
    this.authStore.login({ email, password });
  }
}
```

**Navigation on Success:**
```typescript
this.isAuthenticated$.pipe(
  filter(isAuthenticated => isAuthenticated),
  take(1)
).subscribe(() => {
  this.router.navigate(['/dashboard']);
});
```

**RxJS Operators Used:**
- `filter()` - Only proceed if authenticated
- `take(1)` - Auto-unsubscribe after first emission
- `async` pipe in template - Auto-subscribes and unsubscribes

---

### 2. Dashboard Component (`src/app/features/dashboard/dashboard.component.ts`)

**Purpose:** Main dashboard showing statistics and recent activity.

**How It Works:**
- Displays stats (patients, equipment, appointments, alerts)
- Shows recent activity feed
- Provides quick action buttons
- Uses observables for user data

**State from Store:**
```typescript
user$ = this.authStore.user$;
userEmail$ = this.authStore.userEmail$;
isAuthenticated$ = this.authStore.isAuthenticated$;
```

**Template Usage:**
```html
<span *ngIf="userEmail$ | async as email">{{ email }}</span>
```

**Dashboard Stats:**
```typescript
dashboardStats = {
  totalPatients: 5,
  totalEquipment: 3,
  appointmentsToday: 2,
  pendingAlerts: 1
};
```

**Methods:**
- `navigateToList()` - Navigate to list page
- `logout()` - Trigger logout effect in store
- `refreshSession()` - Extend session expiry
- `addNewRecord()` - Navigate to list (could open dialog)
- `generateReport()` - Placeholder for future feature

---

### 3. List Component (`src/app/features/list/list.component.ts`)

**Purpose:** Display, search, and manage items with full CRUD operations.

**How It Works:**
- Loads items from Mock API on init
- Provides real-time search filtering
- Opens dialogs for add/edit/view
- Handles delete with confirmation

**Loading Items:**
```typescript
loadItems() {
  this.isLoading = true;
  this.mockApiService.getItems().subscribe({
    next: (response) => {
      if (response.status === 'success') {
        this.items = response.data;
        this.filteredItems = [...this.items];
        this.isLoading = false;
      }
    },
    error: (error) => {
      this.error = error?.message;
      this.isLoading = false;
    }
  });
}
```

**Search Implementation:**
```typescript
private filterItems() {
  const searchLower = this.searchTerm.toLowerCase().trim();
  this.filteredItems = this.items.filter(item =>
    item.name.toLowerCase().includes(searchLower) ||
    item.description.toLowerCase().includes(searchLower) ||
    item.id.toString().includes(searchLower)
  );
}
```

**CRUD Operations:**

**Create:**
```typescript
addNewItem() {
  const dialogRef = this.dialog.open(ItemDialogComponent, {
    width: '500px',
    data: { mode: 'add' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.createItem(result);
    }
  });
}
```

**Update:**
```typescript
editItem(item: ListItem) {
  const dialogRef = this.dialog.open(ItemDialogComponent, {
    width: '500px',
    data: { mode: 'edit', item }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.updateItem(item.id, result);
    }
  });
}
```

**Delete:**
```typescript
deleteItem(item: ListItem) {
  if (confirm(`Delete "${item.name}"?`)) {
    this.mockApiService.deleteItem(item.id).subscribe({
      next: (response) => {
        this.loadItems(); // Refresh list
        this.snackBar.open(`Deleted: ${item.name}`, 'Close', {
          duration: 2000
        });
      }
    });
  }
}
```

**RxJS Patterns:**
- Subscribe to API observables with next/error handlers
- Use `afterClosed()` observable from dialog
- Chain operations: dialog close → API call → refresh list

---

### 4. Item Dialog Component (`src/app/shared/components/item-dialog/item-dialog.component.ts`)

**Purpose:** Reusable dialog for viewing, adding, and editing items.

**How It Works:**
- Single component with 3 modes: 'view', 'add', 'edit'
- Reactive form with validation
- Loading state with spinner on save
- Dynamic title and icon based on mode

**Dialog Data Interface:**
```typescript
export interface ItemDialogData {
  mode: 'view' | 'add' | 'edit';
  item?: ListItem;
}
```

**Form Setup:**
```typescript
this.itemForm = this.fb.group({
  name: [data.item?.name || '', Validators.required],
  description: [data.item?.description || '', Validators.required]
});

if (data.mode === 'view') {
  this.itemForm.disable();  // Read-only for view mode
}
```

**Save with Loading State:**
```typescript
onSave(): void {
  if (this.itemForm.valid && !this.isLoading) {
    this.isLoading = true;

    setTimeout(() => {
      this.dialogRef.close(this.itemForm.value);
      this.isLoading = false;
    }, 800);  // Simulate API delay
  }
}
```

**Dynamic UI:**
```typescript
getTitle(): string {
  switch (this.data.mode) {
    case 'view': return 'View Item Details';
    case 'add': return 'Add New Item';
    case 'edit': return 'Edit Item';
  }
}

getIcon(): string {
  switch (this.data.mode) {
    case 'view': return 'visibility';
    case 'add': return 'add';
    case 'edit': return 'edit';
  }
}
```

---

## Interfaces

### 1. Auth Interfaces (`src/app/core/interfaces/auth.interfaces.ts`)

```typescript
export interface User {
  email: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Purpose:** Type safety for authentication-related data structures.

---

### 2. API Interfaces (`src/app/core/interfaces/api.interfaces.ts`)

```typescript
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface ListItem {
  id: number;
  name: string;
  description: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    email: string;
  };
}
```

**Purpose:**
- Generic `ApiResponse<T>` wraps all API responses
- Consistent data structure across the app
- Type safety for API contracts

---

## RxJS Implementation

### Observable Patterns Used

#### 1. **Creation Operators**
```typescript
// of() - Create observable from value
of(response).pipe(delay(1000))

// throwError() - Create error observable
throwError(() => new Error('Failed'))

// EMPTY - Complete immediately
return EMPTY;
```

#### 2. **Transformation Operators**
```typescript
// map() - Transform emitted values
this.user$.pipe(
  map(user => user?.email || '')
)

// switchMap() - Switch to new observable (cancels previous)
credentials$.pipe(
  switchMap(creds => this.authService.login(creds))
)
```

#### 3. **Filtering Operators**
```typescript
// filter() - Only emit values matching condition
this.isAuthenticated$.pipe(
  filter(auth => auth === true)
)
```

#### 4. **Utility Operators**
```typescript
// tap() - Side effects without modifying stream
.pipe(tap(user => console.log(user)))

// delay() - Delay emissions
.pipe(delay(1000))

// take() - Take n emissions then complete
.pipe(take(1))

// catchError() - Handle errors
.pipe(catchError(err => {
  console.error(err);
  return EMPTY;
}))
```

#### 5. **Combination Operators**
```typescript
// select() with multiple sources (Component Store)
readonly authState$ = this.select({
  user: this.user$,
  isAuthenticated: this.isAuthenticated$,
  isLoading: this.isLoading$
});
```

### Subscription Management

#### 1. **Async Pipe (Recommended)**
```html
<div *ngIf="isLoading$ | async">Loading...</div>
<span>{{ userEmail$ | async }}</span>
```
- Auto-subscribes when component initializes
- Auto-unsubscribes when component destroys
- No memory leaks

#### 2. **Manual Subscribe (Lifecycle Management)**
```typescript
// In component
private destroy$ = new Subject<void>();

ngOnInit() {
  this.someObservable$
    .pipe(takeUntil(this.destroy$))
    .subscribe(value => {
      // Handle value
    });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

#### 3. **One-Time Subscription**
```typescript
this.observable$
  .pipe(take(1))
  .subscribe(value => {
    // Executes once, auto-unsubscribes
  });
```

### Effect Pattern (NgRx Component Store)

```typescript
readonly login = this.effect((trigger$: Observable<LoginCredentials>) =>
  trigger$.pipe(
    tap(() => this.setLoading(true)),           // Start loading
    switchMap(credentials =>                      // Switch to login API
      this.authService.login(credentials).pipe(
        tap(user => this.setUser(user)),        // Update state on success
        catchError(error => {                   // Handle errors
          this.setError(error.message);
          return EMPTY;                         // Complete gracefully
        })
      )
    )
  )
);

// Usage in component
this.authStore.login(credentials);  // Triggers the effect
```

### Hot vs Cold Observables

**Cold Observable:**
```typescript
// HTTP calls - each subscriber gets separate execution
this.http.get('/api/items').subscribe(...)
```

**Hot Observable (Shared State):**
```typescript
// Component Store selectors - shared state
this.authStore.user$  // All subscribers get same emissions
```

### Error Handling Strategies

#### 1. **Local Error Handling**
```typescript
.pipe(
  catchError(error => {
    console.error('Local error:', error);
    return of(null);  // Provide fallback value
  })
)
```

#### 2. **Global Error Handling**
```typescript
.pipe(
  catchError(error => {
    this.setError(error.message);  // Update error state
    this.snackBar.open(error.message, 'Close');
    return EMPTY;  // Complete the stream
  })
)
```

#### 3. **Retry Logic**
```typescript
.pipe(
  retry(3),  // Retry 3 times before failing
  catchError(error => {
    // Final error handling
    return throwError(() => error);
  })
)
```

### Best Practices Implemented

1. ✅ **Use async pipe** in templates (auto-unsubscribe)
2. ✅ **Unsubscribe manually** with takeUntil pattern when needed
3. ✅ **Use switchMap** for search/API calls (cancel previous)
4. ✅ **Handle errors** at appropriate levels
5. ✅ **Avoid nested subscribes** (use operators instead)
6. ✅ **Use take(1)** for one-time operations
7. ✅ **Provide fallback values** with defaults/catchError
8. ✅ **Share state** with Component Store selectors

---

## Data Flow Examples

### Login Flow (End-to-End)
```
User enters credentials
       ↓
LoginComponent.onSubmit()
       ↓
authStore.login(credentials)  [Triggers Effect]
       ↓
AuthStore.login effect
  - Sets loading = true
  - Calls AuthService.login()
       ↓
AuthService.login()
  - Calls MockApiService.login()
  - Returns Observable<User>
       ↓
MockApiService validates credentials
  - Returns success/error Observable
  - Delays 1 second
       ↓
AuthService receives response
  - Maps to User object
  - Stores in cookies
  - Returns User
       ↓
AuthStore effect receives User
  - Updates state (setUser)
  - Sets isAuthenticated = true
       ↓
LoginComponent subscribes to isAuthenticated$
  - Detects change
  - Navigates to /dashboard
       ↓
AuthGuard checks isAuthenticated$
  - Allows access to dashboard
       ↓
DashboardComponent displays user email
  - Uses userEmail$ from store
```

### CRUD Operation Flow (Edit Item)
```
User clicks edit icon
       ↓
ListComponent.editItem(item)
       ↓
Opens ItemDialogComponent
  - Passes mode='edit' and item data
  - Pre-fills form
       ↓
User edits and clicks Save
       ↓
ItemDialogComponent.onSave()
  - Shows loading spinner (800ms)
  - Closes dialog with form data
       ↓
ListComponent.dialogRef.afterClosed()
  - Receives updated item data
  - Calls updateItem(id, data)
       ↓
MockApiService.updateItem()
  - Updates in-memory array
  - Returns Observable<ApiResponse>
       ↓
ListComponent.subscribe()
  - Refreshes item list
  - Shows success snackbar
       ↓
UI updates with new data
```

---

## Testing Approach

### Unit Tests Structure

Each component/service has a `.spec.ts` file with:
- Test setup with mocks
- Isolated component testing
- Observable testing with marble diagrams (if needed)

**Example: AuthStore Tests**
```typescript
it('should handle login success', (done) => {
  const user = { email: 'test@test.com', token: 'token' };

  // Mock service to return user
  mockAuthService.login.and.returnValue(of(user));

  // Trigger effect
  store.login({ email: 'test@test.com', password: 'pass' });

  // Verify state change
  store.user$.pipe(take(1)).subscribe(storeUser => {
    expect(storeUser).toEqual(user);
    expect(store.isUserAuthenticated()).toBe(true);
    done();
  });
});
```

### Test Coverage
- 52 unit tests passing
- Tests for components, services, guards, and store
- Mock implementations for all dependencies

---

## NgRx Component Store Deep Dive

### Why Component Store?

**NgRx Component Store** is a lightweight state management solution that provides:
- Local state management at component level
- RxJS-powered reactive updates
- No boilerplate compared to full NgRx Store
- Perfect for feature-specific state

### Core Concepts

#### 1. **Store Initialization**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthStore extends ComponentStore<AuthState> {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    super(initialState);  // Initialize with default state
    this.initializeAuthState();  // Restore from cookies if available
  }
}
```

#### 2. **State Definition**
```typescript
interface AuthState {
  user: User | null;           // Current logged-in user
  isAuthenticated: boolean;    // Auth status flag
  isLoading: boolean;          // Loading indicator
  error: string | null;        // Error message
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};
```

#### 3. **Selectors (Reading State)**

**Simple Selector:**
```typescript
readonly user$ = this.select(state => state.user);
readonly isAuthenticated$ = this.select(state => state.isAuthenticated);
```
- `select()` creates an observable from state
- Automatically emits when selected property changes
- Memoized (only emits when value actually changes)

**Computed Selector (Derived State):**
```typescript
readonly userEmail$ = this.select(
  this.user$,                    // Source selector
  user => user?.email || ''      // Projection function
);
```
- Combines one or more selectors
- Derives new value from state
- Updates automatically when source changes

**Combined Selector:**
```typescript
readonly authState$ = this.select({
  user: this.user$,
  isAuthenticated: this.isAuthenticated$,
  isLoading: this.isLoading$,
  error: this.error$
});
```
- Combines multiple selectors into single object
- Emits when any property changes
- Useful for complex component needs

#### 4. **Updaters (Modifying State)**

**Updater Definition:**
```typescript
readonly setUser = this.updater((state, user: User) => ({
  ...state,                    // Spread existing state
  user,                        // Update user
  isAuthenticated: true,       // Set auth flag
  isLoading: false,           // Clear loading
  error: null                 // Clear any errors
}));
```

**Key Points:**
- Pure functions (no side effects)
- Immutable updates (spread operator)
- Type-safe with TypeScript
- Can take parameters

**Usage in Code:**
```typescript
// In effect or method
this.setUser(newUser);  // Directly call updater
```

**Multiple Updaters:**
```typescript
readonly setLoading = this.updater((state, isLoading: boolean) => ({
  ...state,
  isLoading,
  error: isLoading ? null : state.error  // Clear error on load start
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
```

#### 5. **Effects (Side Effects & Async Operations)**

**Effect Anatomy:**
```typescript
readonly login = this.effect(
  (credentials$: Observable<LoginCredentials>) =>  // Input observable
    credentials$.pipe(
      tap(() => this.setLoading(true)),            // Side effect: set loading
      switchMap(credentials =>                      // Transform to new observable
        this.authService.login(credentials).pipe(
          tap((user: User) => {
            this.setUser(user);                    // Update state on success
          }),
          catchError((error: any) => {
            const errorMessage = error?.message || 'Login failed';
            this.setError(errorMessage);           // Update error state
            return EMPTY;                          // Complete gracefully
          })
        )
      )
    )
);
```

**How Effects Work:**

1. **Effect Declaration:**
   - `this.effect()` creates an effect
   - Takes a function that receives trigger observable
   - Returns an observable (for internal processing)

2. **Trigger Pattern:**
   ```typescript
   // In component
   this.authStore.login({ email, password });

   // Internally becomes:
   // credentialsSubject.next({ email, password })
   ```

3. **Observable Pipeline:**
   - Each trigger creates new emission
   - `switchMap` cancels previous if new one starts
   - Perfect for search/API calls

4. **State Updates Inside Effects:**
   ```typescript
   switchMap(data =>
     this.apiService.getData(data).pipe(
       tap(result => this.updateState(result)),  // Updater call
       catchError(err => {
         this.setError(err);                     // Error updater
         return EMPTY;
       })
     )
   )
   ```

**Effect Types:**

**Login Effect (with API call):**
```typescript
readonly login = this.effect((credentials$: Observable<LoginCredentials>) =>
  credentials$.pipe(
    tap(() => this.setLoading(true)),
    switchMap(credentials =>
      this.authService.login(credentials).pipe(
        tap((user: User) => this.setUser(user)),
        catchError((error: any) => {
          this.setError(error?.message || 'Login failed');
          return EMPTY;
        })
      )
    )
  )
);
```

**Logout Effect (with navigation):**
```typescript
readonly logout = this.effect((trigger$: Observable<void>) =>
  trigger$.pipe(
    tap(() => {
      this.authService.logout();              // Service call
      this.clearAuth();                       // Clear state
      this.router.navigate(['/login']);       // Navigate
    }),
    switchMap(() => EMPTY)                    // Complete
  )
);
```

**Check Auth Status Effect:**
```typescript
readonly checkAuthStatus = this.effect((trigger$: Observable<void>) =>
  trigger$.pipe(
    tap(() => {
      const user = this.authService.getCurrentUser();
      const isAuthenticated = this.authService.isAuthenticated();

      if (user && isAuthenticated) {
        this.setUser(user);                   // Restore session
      } else {
        this.clearAuth();                     // Clear invalid session
      }
    }),
    switchMap(() => EMPTY)
  )
);
```

#### 6. **Imperative State Reading**

While selectors are reactive (observables), sometimes you need the current value immediately:

```typescript
// Helper methods
getCurrentUser(): User | null {
  return this.get().user;  // this.get() returns current state
}

isUserAuthenticated(): boolean {
  return this.get().isAuthenticated;
}

getUserEmail(): string {
  return this.get().user?.email || '';
}
```

**Use Cases:**
- Guards that need immediate boolean result
- Conditional logic before async operations
- One-time value checks

#### 7. **Initialization Logic**

**Restore Session on App Start:**
```typescript
private initializeAuthState(): void {
  const user = this.authService.getCurrentUser();
  const isAuthenticated = this.authService.isAuthenticated();

  if (user && isAuthenticated && this.authService.isSessionValid()) {
    this.setUser(user);        // Restore authenticated state
  } else {
    this.clearAuth();          // Clear any invalid data
    this.authService.logout(); // Clean up cookies
    this.router.navigate(['/login']);  // Redirect to login
  }
}
```

Called in constructor to restore state from cookies on app refresh.

### Component Store vs Full NgRx Store

**Component Store (Used Here):**
- ✅ Lightweight, minimal boilerplate
- ✅ Perfect for feature/local state
- ✅ Can be provided at component or root level
- ✅ RxJS-based, easy to understand
- ✅ Great for authentication, form state, local data

**Full NgRx Store:**
- Global state across entire app
- Actions, Reducers, Selectors separation
- DevTools support for time-travel debugging
- More boilerplate, steeper learning curve
- Better for large apps with complex state

### Using Component Store in Components

**1. Inject the Store:**
```typescript
constructor(private authStore: AuthStore) {}
```

**2. Subscribe to Selectors:**
```typescript
// In component class
userEmail$ = this.authStore.userEmail$;
isAuthenticated$ = this.authStore.isAuthenticated$;

// In template
<span>{{ userEmail$ | async }}</span>
<div *ngIf="isAuthenticated$ | async">Protected Content</div>
```

**3. Trigger Effects:**
```typescript
// Login
this.authStore.login({ email, password });

// Logout
this.authStore.logout();

// Check session
this.authStore.checkAuthStatus();

// Refresh session
this.authStore.refreshSession();
```

**4. Read Current State (when needed):**
```typescript
const currentUser = this.authStore.getCurrentUser();
if (currentUser) {
  console.log('User:', currentUser.email);
}
```

### Advanced Patterns

#### Pattern 1: Effect with Multiple Operations
```typescript
readonly complexOperation = this.effect((data$: Observable<any>) =>
  data$.pipe(
    tap(() => this.setLoading(true)),
    switchMap(data =>
      this.service1.getData(data).pipe(
        switchMap(result1 =>
          this.service2.processData(result1).pipe(
            tap(finalResult => {
              this.updateState(finalResult);
              this.setLoading(false);
            })
          )
        )
      )
    ),
    catchError(error => {
      this.setError(error.message);
      return EMPTY;
    })
  )
);
```

#### Pattern 2: Conditional Effect
```typescript
readonly conditionalEffect = this.effect((input$: Observable<any>) =>
  input$.pipe(
    withLatestFrom(this.isAuthenticated$),  // Combine with selector
    filter(([input, isAuth]) => isAuth),    // Only proceed if authenticated
    map(([input]) => input),
    switchMap(input => this.service.call(input))
  )
);
```

#### Pattern 3: Debounced Effect (Search)
```typescript
readonly search = this.effect((query$: Observable<string>) =>
  query$.pipe(
    debounceTime(300),                      // Wait 300ms after typing stops
    distinctUntilChanged(),                 // Only if value changed
    switchMap(query =>
      this.searchService.search(query).pipe(
        tap(results => this.setResults(results))
      )
    )
  )
);
```

### Memory Management

**Component Store Lifecycle:**
```typescript
@Injectable({ providedIn: 'root' })  // Singleton - lives for app lifetime

// OR

@Injectable()  // Provided in component - destroyed with component
@Component({
  providers: [LocalStore]  // New instance per component
})
```

**Automatic Cleanup:**
- Component Store handles subscription cleanup
- Effects complete when store is destroyed
- No manual unsubscribe needed for selectors

### Testing Component Store

```typescript
describe('AuthStore', () => {
  let store: AuthStore;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'logout']);
    store = new AuthStore(mockAuthService, mockRouter);
  });

  it('should update state on login', (done) => {
    const user = { email: 'test@test.com', token: 'token' };
    mockAuthService.login.and.returnValue(of(user));

    store.login({ email: 'test@test.com', password: 'pass' });

    store.user$.pipe(take(1)).subscribe(storeUser => {
      expect(storeUser).toEqual(user);
      expect(store.isUserAuthenticated()).toBe(true);
      done();
    });
  });

  it('should handle errors', (done) => {
    mockAuthService.login.and.returnValue(
      throwError(() => new Error('Failed'))
    );

    store.login({ email: 'test@test.com', password: 'wrong' });

    store.error$.pipe(skip(1), take(1)).subscribe(error => {
      expect(error).toBe('Failed');
      expect(store.isUserAuthenticated()).toBe(false);
      done();
    });
  });
});
```

### Key Takeaways

1. **Selectors** = Read state reactively (Observables)
2. **Updaters** = Modify state (Pure functions)
3. **Effects** = Handle side effects & async operations
4. **Component Store** = Local, feature-specific state management
5. **RxJS Integration** = Seamless observable-based state flow

---

## Summary

This application demonstrates:

1. **Modern Angular Architecture**
   - Standalone components
   - Feature-based structure
   - Dependency injection

2. **Reactive Programming**
   - RxJS observables throughout
   - Component Store for state
   - Reactive forms

3. **Security**
   - Route guards
   - Cookie-based auth
   - Session management

4. **Best Practices**
   - Type safety with TypeScript
   - Unit testing
   - Error handling
   - Memory leak prevention

5. **User Experience**
   - Loading states
   - Error messages
   - Responsive design
   - Real-time updates