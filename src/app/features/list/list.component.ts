import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '../../core/stores/auth.store';
import { MockApiService } from '../../core/services/mock-api.service';
import { ListItem } from '../../core/interfaces/api.interfaces';
import { ItemDialogComponent, ItemDialogData } from '../../shared/components/item-dialog/item-dialog.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  items: ListItem[] = [];
  filteredItems: ListItem[] = [];
  searchTerm: string = '';
  isLoading = false;
  error: string | null = null;

  // Observable selectors from auth store
  userEmail$ = this.authStore.userEmail$;
  isAuthenticated$ = this.authStore.isAuthenticated$;

  constructor(
    private router: Router,
    private authStore: AuthStore,
    private mockApiService: MockApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.authStore.checkAuthStatus();
    this.loadItems();
  }

  loadItems() {
    this.isLoading = true;
    this.error = null;

    this.mockApiService.getItems().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.items = response.data;
          this.filteredItems = [...this.items];
          this.isLoading = false;
        } else {
          this.error = response.message || 'Failed to load items';
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.error = error?.message || 'Failed to load items';
        this.isLoading = false;
        this.showErrorMessage(this.error || 'Unknown error occurred');
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authStore.logout();
    this.showLogoutMessage();
  }

  refreshItems() {
    this.loadItems();
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showLogoutMessage() {
    this.snackBar.open('You have been logged out successfully', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  // Handle item actions
  viewItem(item: ListItem) {
    const dialogData: ItemDialogData = {
      mode: 'view',
      item: item
    };

    this.dialog.open(ItemDialogComponent, {
      width: '500px',
      data: dialogData
    });
  }

  editItem(item: ListItem) {
    const dialogData: ItemDialogData = {
      mode: 'edit',
      item: item
    };

    const dialogRef = this.dialog.open(ItemDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateItem(item.id, result);
      }
    });
  }

  deleteItem(item: ListItem) {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      this.mockApiService.deleteItem(item.id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.loadItems(); // Refresh the list
            this.snackBar.open(`Deleted item: ${item.name}`, 'Close', {
              duration: 2000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.showErrorMessage(response.message || 'Failed to delete item');
          }
        },
        error: (error) => {
          this.showErrorMessage(error?.message || 'Failed to delete item');
        }
      });
    }
  }

  addNewItem() {
    const dialogData: ItemDialogData = {
      mode: 'add'
    };

    const dialogRef = this.dialog.open(ItemDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createItem(result);
      }
    });
  }

  private createItem(itemData: Omit<ListItem, 'id'>) {
    this.mockApiService.createItem(itemData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.loadItems(); // Refresh the list
          this.snackBar.open(`Created item: ${response.data.name}`, 'Close', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.showErrorMessage(response.message || 'Failed to create item');
        }
      },
      error: (error) => {
        this.showErrorMessage(error?.message || 'Failed to create item');
      }
    });
  }

  private updateItem(id: number, itemData: Partial<ListItem>) {
    this.mockApiService.updateItem(id, itemData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.loadItems(); // Refresh the list
          this.snackBar.open(`Updated item: ${response.data.name}`, 'Close', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.showErrorMessage(response.message || 'Failed to update item');
        }
      },
      error: (error) => {
        this.showErrorMessage(error?.message || 'Failed to update item');
      }
    });
  }

  // Search functionality
  onSearchChange() {
    this.filterItems();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterItems();
  }

  private filterItems() {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredItems = this.items.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.id.toString().includes(searchLower)
    );
  }
}