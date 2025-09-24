import { TestBed } from '@angular/core/testing';
import { MockApiService } from './mock-api.service';
import { LoginRequest } from '../interfaces/api.interfaces';

describe('MockApiService', () => {
  let service: MockApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with valid credentials', (done) => {
    const loginRequest: LoginRequest = {
      email: 'admin@caremonitor.com',
      password: 'password123'
    };

    service.login(loginRequest).subscribe({
      next: (response) => {
        expect(response.status).toBe('success');
        expect(response.data.user.email).toBe(loginRequest.email);
        expect(response.data.token).toContain('mock-jwt-token-');
        done();
      },
      error: done.fail
    });
  });

  it('should reject login with invalid credentials', (done) => {
    const loginRequest: LoginRequest = {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    };

    service.login(loginRequest).subscribe({
      next: () => done.fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Invalid email or password');
        done();
      }
    });
  });

  it('should get items list', (done) => {
    service.getItems().subscribe({
      next: (response) => {
        expect(response.status).toBe('success');
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        done();
      },
      error: done.fail
    });
  });

  it('should get single item by id', (done) => {
    service.getItem(1).subscribe({
      next: (response) => {
        expect(response.status).toBe('success');
        expect(response.data.id).toBe(1);
        done();
      },
      error: done.fail
    });
  });

  it('should return error for non-existent item', (done) => {
    service.getItem(999).subscribe({
      next: () => done.fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Item not found');
        done();
      }
    });
  });
});