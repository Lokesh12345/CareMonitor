import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListItem } from '../../../core/interfaces/api.interfaces';

export interface ItemDialogData {
  mode: 'view' | 'add' | 'edit';
  item?: ListItem;
}

@Component({
  selector: 'app-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>{{ getIcon() }}</mat-icon>
        {{ getTitle() }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="itemForm" class="item-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" [readonly]="data.mode === 'view'">
            <mat-error *ngIf="itemForm.get('name')?.hasError('required')">
              Name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea
              matInput
              formControlName="description"
              rows="3"
              [readonly]="data.mode === 'view'">
            </textarea>
            <mat-error *ngIf="itemForm.get('description')?.hasError('required')">
              Description is required
            </mat-error>
          </mat-form-field>

          <div *ngIf="data.mode === 'view' && data.item" class="item-id">
            <strong>ID:</strong> {{ data.item.id }}
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.mode === 'view' ? 'Close' : 'Cancel' }}
        </button>
        <button
          *ngIf="data.mode !== 'view'"
          mat-raised-button
          color="primary"
          [disabled]="itemForm.invalid || isLoading"
          (click)="onSave()">
          <mat-spinner *ngIf="isLoading" diameter="20" class="button-spinner"></mat-spinner>
          <span *ngIf="!isLoading">{{ data.mode === 'add' ? 'Add' : 'Save' }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 400px;
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      color: rgba(0, 0, 0, 0.87);
    }

    .item-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }

    .item-id {
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    mat-dialog-content {
      min-height: 200px;
      padding-top: 24px;
      overflow: visible;
    }

    mat-dialog-actions {
      margin-top: 20px;
      padding: 16px 24px 24px 24px;
      gap: 8px;
    }

    .button-spinner {
      display: inline-block;
      margin: 0;
    }

    button {
      min-width: 80px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `]
})
export class ItemDialogComponent {
  itemForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemDialogData
  ) {
    this.itemForm = this.fb.group({
      name: [data.item?.name || '', Validators.required],
      description: [data.item?.description || '', Validators.required]
    });

    if (data.mode === 'view') {
      this.itemForm.disable();
    }
  }

  getTitle(): string {
    switch (this.data.mode) {
      case 'view': return 'View Item Details';
      case 'add': return 'Add New Item';
      case 'edit': return 'Edit Item';
      default: return 'Item';
    }
  }

  getIcon(): string {
    switch (this.data.mode) {
      case 'view': return 'visibility';
      case 'add': return 'add';
      case 'edit': return 'edit';
      default: return 'info';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.itemForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formValue = this.itemForm.value;

      // Simulate API delay with setTimeout
      setTimeout(() => {
        if (this.data.mode === 'edit' && this.data.item) {
          this.dialogRef.close({ ...this.data.item, ...formValue });
        } else {
          this.dialogRef.close(formValue);
        }
        this.isLoading = false;
      }, 800); // 800ms delay to show spinner
    }
  }
}