import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Observable selectors from auth store
  user$ = this.authStore.user$;
  userEmail$ = this.authStore.userEmail$;
  isAuthenticated$ = this.authStore.isAuthenticated$;

  // Dashboard statistics based on actual data
  dashboardStats = {
    totalPatients: 5, 
    newPatientsThisWeek: 2,
    totalEquipment: 3, 
    equipmentActive: 3,
    appointmentsToday: 2,
    appointmentsWeek: 8,
    pendingAlerts: 1,
    urgentAlerts: 0
  };

  // Recent activities based on actual data
  recentActivities = [
    {
      title: 'Patient Record #005 - Charlie Brown physical therapy',
      time: '2 minutes ago',
      type: 'patient',
      icon: 'person_add'
    },
    {
      title: 'Equipment Check #003 - Stethoscope maintenance',
      time: '15 minutes ago',
      type: 'equipment',
      icon: 'medical_services'
    },
    {
      title: 'Patient Record #004 - Alice Williams medication review',
      time: '1 hour ago',
      type: 'patient',
      icon: 'event'
    },
    {
      title: 'Equipment Check #002 - Thermometer verification',
      time: '3 hours ago',
      type: 'equipment',
      icon: 'medical_services'
    },
    {
      title: 'Patient Record #003 - Bob Johnson lab results',
      time: '5 hours ago',
      type: 'patient',
      icon: 'assignment'
    }
  ];

  constructor(
    private router: Router,
    private authStore: AuthStore,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.authStore.checkAuthStatus();
  }

  navigateToList() {
    this.router.navigate(['/list']);
  }

  logout() {
    this.authStore.logout();
    this.showLogoutMessage();
  }

  private showLogoutMessage() {
    this.snackBar.open('You have been logged out successfully', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  // Refresh session (extend token expiry)
  refreshSession() {
    this.authStore.refreshSession();
    this.snackBar.open('Session refreshed', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  // Dashboard action methods
  addNewRecord() {
    this.router.navigate(['/list']);
    // Could also open dialog directly here if desired
  }

  generateReport() {
    this.snackBar.open('Generating report...', 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }
}