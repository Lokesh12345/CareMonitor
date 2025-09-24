import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../../core/stores/auth.store';
import { LoginCredentials } from '../../../core/interfaces/auth.interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Observable selectors from store
  isLoading$ = this.authStore.isLoading$;
  error$ = this.authStore.error$;
  isAuthenticated$ = this.authStore.isAuthenticated$;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authStore: AuthStore,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['admin@caremonitor.com', [Validators.required, Validators.email]],
      password: ['password123', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Subscribe to authentication state changes
    this.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.showSuccessMessage();
          this.router.navigate(['/dashboard']);
        }
      });

    // Subscribe to error changes
    this.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.showErrorMessage(error);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      // Clear any previous errors
      this.authStore.clearError();

      // Trigger login through the store
      this.authStore.login(credentials);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccessMessage() {
    this.snackBar.open('Login successful!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Helper method to show demo credentials
  fillDemoCredentials() {
    this.loginForm.patchValue({
      email: 'admin@caremonitor.com',
      password: 'password123'
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}