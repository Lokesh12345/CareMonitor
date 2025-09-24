# CareMonitor 🏥

A modern healthcare monitoring application built with Angular 18, designed to help healthcare professionals manage patient records, equipment, and appointments all in one place.

## What's This About?

CareMonitor is a web application that makes it easy to track and manage healthcare data. Whether you're monitoring patient records, keeping tabs on medical equipment, or managing appointments, this app has you covered with a clean, intuitive interface.

## What You'll Find Inside

- **Secure Login** - Cookie-based authentication that keeps your data safe
- **Dashboard** - Get a bird's-eye view of everything happening in your facility
  - Patient statistics
  - Equipment status
  - Today's appointments
  - Pending alerts
  - Recent activity feed
- **Item Management** - Full CRUD operations (Create, Read, Update, Delete) for:
  - Patient records
  - Equipment checks
  - Other monitoring items
- **Search & Filter** - Quickly find what you're looking for
- **Responsive Design** - Works great on desktop, tablet, and mobile

## Getting Started

### What You'll Need

- Node.js (v18 or higher)
- npm (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/Lokesh12345/CareMonitor.git
   cd CareMonitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Fire it up!**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

## How to Use It

### Logging In

Use these demo credentials to get started:
- **Email:** admin@caremonitor.com
- **Password:** password123

(There's even a handy button on the login page that fills these in for you!)

### Managing Items

1. **View Items** - Click the eye icon to see details
2. **Edit Items** - Click the pencil icon to make changes
3. **Delete Items** - Click the trash icon to remove (don't worry, you'll get a confirmation first)
4. **Add New Items** - Hit the "Add New Item" button in the top right

### Searching

Just start typing in the search box - it filters as you type! Search works on item names, descriptions, and IDs.

## Tech Stack

We built this with some awesome tools:

- **Angular 18** - The latest and greatest Angular framework
- **Angular Material** - Google's Material Design components for a polished look
- **NgRx Component Store** - Smart state management that just works
- **TypeScript** - Because we like our code type-safe
- **SCSS** - Making our styles pretty and maintainable
- **ngx-cookie-service** - Handling cookies the right way

## Architecture & Design Approach

### Component Architecture

The application follows Angular's **standalone component architecture** introduced in Angular 18, eliminating the need for NgModules and providing better tree-shaking and lazy loading capabilities.

**Key Architectural Patterns:**

1. **Feature-Based Organization**
   - Features are self-contained modules (auth, dashboard, list)
   - Each feature has its own components, styles, and tests
   - Promotes code reusability and maintainability

2. **State Management with NgRx Component Store**
   - Reactive state management using RxJS observables
   - Component Store provides local state for authentication
   - Centralized auth state accessible across the app
   - Benefits: predictable state updates, easier debugging, reactive UI

3. **Layered Architecture**
   ```
   Presentation Layer (Components)
          ↓
   State Management (Stores)
          ↓
   Business Logic (Services)
          ↓
   Data Layer (Mock API)
   ```

4. **Security & Route Protection**
   - Route guards (`AuthGuard`, `NoAuthGuard`) protect routes
   - Cookie-based authentication with session management
   - Automatic token refresh and expiry handling
   - Secure navigation flow (auto-redirect on logout/session expiry)

5. **Dependency Injection**
   - Services are provided at root level for singleton pattern
   - Components inject only what they need
   - Promotes testability and loose coupling

### Technical Approach

**Authentication Flow:**
```
Login → AuthService → Mock API → AuthStore (state update) → Cookie Storage
     ← Navigate to Dashboard ← Route Guard Check ← Auth State
```

**CRUD Operations Flow:**
```
User Action → Component → Dialog (Add/Edit/View)
          ↓
     API Service → Mock Backend
          ↓
     Observable Response → Update UI
          ↓
     Show Success/Error Snackbar
```

**Reactive Programming:**
- Extensive use of RxJS observables for async operations
- Reactive forms for validation and user input
- Observable patterns for state management and data flow

**Design Decisions:**

- **Standalone Components**: Better performance, simpler architecture
- **Mock API**: Simulate real backend for development/demo
- **Material Design**: Consistent, accessible UI out of the box
- **Responsive Design**: Mobile-first approach with flexbox/grid
- **TypeScript Strict Mode**: Type safety and early error detection

## Project Structure

```
src/
├── app/
│   ├── core/              # Core services, guards, and stores
│   │   ├── guards/        # Route protection (AuthGuard, NoAuthGuard)
│   │   ├── interfaces/    # TypeScript interfaces & types
│   │   ├── services/      # API and auth services (singleton)
│   │   └── stores/        # NgRx Component Store for state
│   ├── features/          # Feature modules (lazy-loaded)
│   │   ├── auth/login/    # Login page with reactive forms
│   │   ├── dashboard/     # Main dashboard with stats
│   │   └── list/          # Items list and CRUD operations
│   └── shared/            # Shared/reusable components
│       └── components/    # Dialog, UI components
```

## Available Scripts

- `ng serve` - Run the dev server
- `ng build` - Build for production
- `ng test` - Run unit tests
- `ng lint` - Check code quality

## Features in Detail

### Authentication
- Secure cookie-based authentication
- Session management with auto-refresh
- Protected routes (can't access dashboard without logging in)
- Automatic redirect to login when session expires

### Dashboard
- Real-time statistics display
- Activity timeline showing recent updates
- Quick action buttons for common tasks
- Beautiful, color-coded stat cards

### Item Management
- Add new items with form validation
- View item details in a clean modal
- Edit existing items with ease
- Delete with confirmation (because accidents happen)
- All changes happen in real-time

## Browser Support

Works great on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)




## License

This project is open source and available for educational and development purposes.

---
