import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LoginRequest, LoginResponse, ListItem, ApiResponse } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MockApiService {
  private readonly MOCK_DELAY = 1000; // Simulate network delay

  // Mock data
  private mockItems: ListItem[] = [
    { id: 1, name: 'Patient Record #001', description: 'John Doe - Regular checkup scheduled' },
    { id: 2, name: 'Patient Record #002', description: 'Jane Smith - Follow-up appointment' },
    { id: 3, name: 'Patient Record #003', description: 'Bob Johnson - Lab results review' },
    { id: 4, name: 'Equipment Check #001', description: 'Blood pressure monitor calibration' },
    { id: 5, name: 'Equipment Check #002', description: 'Thermometer verification' },
    { id: 6, name: 'Patient Record #004', description: 'Alice Williams - Medication review' },
    { id: 7, name: 'Equipment Check #003', description: 'Stethoscope maintenance' },
    { id: 8, name: 'Patient Record #005', description: 'Charlie Brown - Physical therapy session' }
  ];

  constructor() {}

  /**
   * Mock login API endpoint
   * POST /api/login
   */
  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    // Simulate validation
    if (request.email === 'admin@caremonitor.com' && request.password === 'password123') {
      const response: ApiResponse<LoginResponse> = {
        status: 'success',
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            email: request.email
          }
        },
        message: 'Login successful'
      };

      return of(response).pipe(delay(this.MOCK_DELAY));
    } else {
      return throwError(() => ({
        status: 'error',
        message: 'Invalid email or password'
      })).pipe(delay(this.MOCK_DELAY));
    }
  }

  /**
   * Mock items list API endpoint
   * GET /api/items
   */
  getItems(): Observable<ApiResponse<ListItem[]>> {
    const response: ApiResponse<ListItem[]> = {
      status: 'success',
      data: [...this.mockItems],
      message: 'Items retrieved successfully'
    };

    return of(response).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Mock get single item API endpoint
   * GET /api/items/:id
   */
  getItem(id: number): Observable<ApiResponse<ListItem>> {
    const item = this.mockItems.find(item => item.id === id);

    if (item) {
      const response: ApiResponse<ListItem> = {
        status: 'success',
        data: item,
        message: 'Item retrieved successfully'
      };

      return of(response).pipe(delay(this.MOCK_DELAY));
    } else {
      return throwError(() => ({
        status: 'error',
        message: 'Item not found'
      })).pipe(delay(this.MOCK_DELAY));
    }
  }

  /**
   * Mock create item API endpoint
   * POST /api/items
   */
  createItem(item: Omit<ListItem, 'id'>): Observable<ApiResponse<ListItem>> {
    const newItem: ListItem = {
      id: Math.max(...this.mockItems.map(i => i.id)) + 1,
      ...item
    };

    this.mockItems.push(newItem);

    const response: ApiResponse<ListItem> = {
      status: 'success',
      data: newItem,
      message: 'Item created successfully'
    };

    return of(response).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Mock update item API endpoint
   * PUT /api/items/:id
   */
  updateItem(id: number, updates: Partial<ListItem>): Observable<ApiResponse<ListItem>> {
    const index = this.mockItems.findIndex(item => item.id === id);

    if (index !== -1) {
      this.mockItems[index] = { ...this.mockItems[index], ...updates };

      const response: ApiResponse<ListItem> = {
        status: 'success',
        data: this.mockItems[index],
        message: 'Item updated successfully'
      };

      return of(response).pipe(delay(this.MOCK_DELAY));
    } else {
      return throwError(() => ({
        status: 'error',
        message: 'Item not found'
      })).pipe(delay(this.MOCK_DELAY));
    }
  }

  /**
   * Mock delete item API endpoint
   * DELETE /api/items/:id
   */
  deleteItem(id: number): Observable<ApiResponse<null>> {
    const index = this.mockItems.findIndex(item => item.id === id);

    if (index !== -1) {
      this.mockItems.splice(index, 1);

      const response: ApiResponse<null> = {
        status: 'success',
        data: null,
        message: 'Item deleted successfully'
      };

      return of(response).pipe(delay(this.MOCK_DELAY));
    } else {
      return throwError(() => ({
        status: 'error',
        message: 'Item not found'
      })).pipe(delay(this.MOCK_DELAY));
    }
  }
}