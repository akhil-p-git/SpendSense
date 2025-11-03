# SpendSense React Architecture

**Version**: 1.0  
**Date**: November 2025

---

## Overview

The SpendSense React frontend is built with modern web technologies and follows a scalable, maintainable architecture. This document outlines the component structure, state management, and data flow.

## Tech Stack

- **React 18** - UI library with hooks and Suspense
- **TypeScript** - Type safety across the application
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client with interceptors
- **Recharts** - Chart library for data visualization

## Project Structure

```
ui-react/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Shared components (Button, Card, Loading, etc.)
│   │   ├── layout/         # Layout components (Header, Tabs, MobileMenu)
│   │   ├── profile/        # Profile-related components
│   │   ├── recommendations/# Recommendation components
│   │   ├── whatif/         # What-If simulator components
│   │   ├── transactions/   # Transaction components
│   │   └── operator/        # Operator dashboard components
│   ├── features/           # Feature-specific components
│   │   ├── users/          # User selection and management
│   │   ├── profile/        # Profile view
│   │   ├── recommendations/# Recommendations view
│   │   ├── whatif/         # What-If simulator view
│   │   ├── transactions/   # Transactions view
│   │   └── operator/        # Operator dashboard view
│   ├── hooks/              # Custom React hooks
│   │   ├── useApi.ts       # API query/mutation hooks
│   │   └── useDebounce.ts  # Debounce hook
│   ├── services/           # API service layer
│   │   └── api.ts          # Axios-based API service
│   ├── store/              # Zustand stores
│   │   ├── useStore.ts    # Legacy store (to be deprecated)
│   │   ├── userStore.ts   # User state management
│   │   ├── uiStore.ts     # UI state (tabs, loading, modals, toasts)
│   │   └── scenarioStore.ts # What-If scenario state
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # All type definitions
│   ├── utils/              # Utility functions
│   │   └── format.ts       # Formatting utilities
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── UserRecommendationsPage.tsx
│   │   ├── UserWhatIfPage.tsx
│   │   ├── UserTransactionsPage.tsx
│   │   └── OperatorPage.tsx
│   ├── App.tsx             # Main app component with routing
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── dist/                   # Production build output
├── package.json
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## Component Architecture

### Component Hierarchy

```
App
├── ErrorBoundary
│   └── QueryClientProvider
│       └── BrowserRouter
│           └── Layout
│               ├── Header
│               │   ├── UserSelector
│               │   └── MobileMenu
│               ├── Tabs
│               ├── ErrorMessage (if error)
│               └── Outlet (Routes)
│                   ├── HomePage
│                   ├── UserRecommendationsPage
│                   │   └── RecommendationsView
│                   │       └── RecommendationCard[]
│                   ├── UserWhatIfPage
│                   │   └── WhatIfView
│                   │       ├── ScenarioTabs
│                   │       ├── BasicScenariosTab
│                   │       ├── GoalBasedPlanningTab
│                   │       ├── CombinedScenariosTab
│                   │       ├── CompareScenariosTab
│                   │       └── ExportButtons
│                   ├── UserTransactionsPage
│                   │   └── TransactionsView
│                   │       ├── SpendingChart
│                   │       └── TransactionsTab
│                   │           └── TransactionRow[]
│                   └── OperatorPage
│                       └── OperatorView
│                           ├── PersonaDistributionCard
│                           ├── RecommendationTrackingCard
│                           ├── SystemHealthCard
│                           ├── OperatorFilters
│                           └── OperatorUserList
│           └── ToastContainer
```

### Component Types

#### 1. Common Components (`/components/common/`)

Reusable components used throughout the app:
- **Button**: Accessible button with variants (primary, secondary, danger)
- **Card**: Container component with consistent styling
- **LoadingSpinner**: Loading indicator with ARIA support
- **ErrorMessage**: Error display component
- **ErrorBoundary**: Catches React errors
- **ToastContainer**: Toast notification system
- **ConfirmationModal**: Reusable confirmation dialog

#### 2. Layout Components (`/components/layout/`)

Structure and navigation:
- **Header**: App header with branding and user selector
- **Tabs**: Tab navigation with keyboard support
- **Layout**: Main layout wrapper
- **MobileMenu**: Hamburger menu for mobile devices

#### 3. Feature Components (`/components/{feature}/`)

Feature-specific components:
- **Profile**: PersonaBadge, MetricsGrid
- **Recommendations**: RecommendationCard
- **What-If**: Scenario-specific components
- **Transactions**: TransactionRow, SpendingChart
- **Operator**: Analytics cards and filters

#### 4. Feature Views (`/features/{feature}/`)

Complete feature views that orchestrate components:
- **ProfileView**: Displays user profile
- **RecommendationsView**: Displays recommendations
- **WhatIfView**: What-If simulator with tabs
- **TransactionsView**: Transaction history and charts
- **OperatorView**: Operator dashboard

## State Management

### Zustand Stores

#### User Store (`store/userStore.ts`)

Manages user-related state:
```typescript
{
  currentUserId: string | null
  currentUser: User | null
  consent: boolean | null
  setCurrentUserId()
  setCurrentUser()
  setConsent()
  clearUser()
}
```
- Persisted to localStorage
- Used across all user-related features

#### UI Store (`store/uiStore.ts`)

Manages UI state:
```typescript
{
  activeTab: string
  loading: boolean
  loadingMessage: string | null
  toasts: Toast[]
  modals: Modal[]
  setActiveTab()
  setLoading()
  showToast()
  hideToast()
  showModal()
  hideModal()
}
```
- Global loading states
- Toast notifications
- Modal management

#### Scenario Store (`store/scenarioStore.ts`)

Manages What-If scenario state:
```typescript
{
  activeScenarioType: string
  scenarioResults: Record<string, ScenarioResult>
  currentScenarioResult: ScenarioResult | null
  setActiveScenarioType()
  setScenarioResult()
  clearScenarioResults()
}
```

### React Query (TanStack Query)

Server state management:
- **Caching**: Automatic caching of API responses
- **Stale Time**: Configurable per endpoint
- **Refetching**: Automatic refetching on window focus (disabled)
- **Invalidation**: Automatic cache invalidation on mutations
- **Optimistic Updates**: Immediate UI updates before server confirmation

### React Router

Client-side routing:
- Route-based code splitting with lazy loading
- URL-based navigation
- Browser history support
- Protected routes (future enhancement)

## Data Flow

### API Request Flow

```
Component
  ↓
useApi Hook (React Query)
  ↓
ApiService (Axios)
  ↓
Axios Interceptor (Retry Logic)
  ↓
Flask Backend API
  ↓
Response
  ↓
React Query Cache
  ↓
Component Update
```

### User Action Flow

```
User Interaction
  ↓
Component Event Handler
  ↓
Zustand Store Update (if client state)
  ↓
React Query Mutation (if server state)
  ↓
Optimistic Update (immediate UI change)
  ↓
API Request
  ↓
Server Response
  ↓
Cache Update
  ↓
Component Re-render
```

## Error Handling

### ErrorBoundary

Catches React component errors:
- Displays friendly error message
- Provides "Try Again" and "Go Home" options
- Shows error details in development mode

### API Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **403 Errors**: Shows consent message
- **404 Errors**: Redirects to user selector
- **500 Errors**: Shows generic error message
- **Timeouts**: 30-second timeout with error message

### Toast Notifications

- Success: Green toast with checkmark
- Error: Red toast with X icon
- Info: Blue toast with info icon
- Warning: Orange toast with warning icon
- Auto-dismiss after 3 seconds (configurable)

## Performance Optimizations

### Code Splitting

- Pages lazy-loaded with `React.lazy()`
- Route-based splitting reduces initial bundle
- Separate chunks for each major feature

### Memoization

- **React.memo**: Applied to Card, LoadingSpinner
- **useMemo**: Expensive calculations memoized
- **useCallback**: Event handlers memoized where needed

### Debouncing

- Slider inputs debounced (300ms default)
- Prevents excessive API calls
- Custom `useDebounce` hook

### Caching

- React Query caches API responses
- Stale time varies by endpoint
- Automatic cache invalidation on mutations

## Accessibility

### ARIA Labels

- All interactive elements have ARIA labels
- Role attributes set correctly
- Live regions for dynamic content

### Keyboard Navigation

- Tab navigation through all elements
- Arrow keys for tabs
- Enter/Space for buttons
- Escape for modals
- Focus indicators visible

### Screen Reader Support

- Semantic HTML
- ARIA live regions
- Loading states announced
- Error messages announced

## Responsive Design

### Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

### Mobile-First Approach

- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly buttons (min 44x44px)
- Hamburger menu for mobile navigation

## API Integration

### API Service Layer

Centralized API client (`services/api.ts`):
- Axios instance with base URL
- Request/response interceptors
- Error handling
- Retry logic
- TypeScript types

### React Query Hooks

Custom hooks (`hooks/useApi.ts`):
- `useUsers()` - Get all users
- `useProfile(userId)` - Get user profile
- `useRecommendations(userId)` - Get recommendations
- `useWhatIfScenario()` - Run scenarios
- `usePersonaDistribution()` - Operator analytics
- And more...

### Request Flow

1. Component calls hook
2. Hook calls API service
3. API service makes HTTP request
4. Response cached by React Query
5. Component receives data
6. UI updates automatically

## Deployment

### Build Process

```bash
cd ui-react
npm run build
```

Outputs to `ui-react/dist/`:
- `index.html`
- `assets/` with JS and CSS bundles

### Flask Integration

Flask serves React build:
- Static folder: `ui-react/dist`
- Fallback to old UI if build not found
- Catch-all route serves `index.html` for React Router

### Environment Variables

- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000`)
- Set in `.env` file for different environments

## Future Enhancements

### Planned Features

- [ ] Authentication/Authorization
- [ ] Protected routes
- [ ] Real-time updates (WebSockets)
- [ ] Offline support (Service Worker)
- [ ] PWA capabilities
- [ ] Advanced filtering
- [ ] Data export (CSV)
- [ ] Print functionality

### Performance Improvements

- [ ] Virtual scrolling for large lists
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] CDN integration
- [ ] Server-side rendering (SSR)

## Best Practices

### Component Design

- Single Responsibility Principle
- Composition over inheritance
- Props interface for type safety
- Memoization for expensive components

### State Management

- Server state → React Query
- Client state → Zustand
- Form state → React Hook Form (future)
- URL state → React Router

### Error Handling

- Always handle loading states
- Provide user-friendly error messages
- Log errors for debugging
- Use ErrorBoundary for component errors

### Performance

- Lazy load routes
- Memoize expensive calculations
- Debounce user inputs
- Optimize re-renders

## Troubleshooting

### Common Issues

1. **API calls failing**: Check CORS configuration
2. **Build errors**: Check TypeScript errors
3. **Routing issues**: Verify React Router setup
4. **State not persisting**: Check Zustand persistence
5. **Styling issues**: Verify Tailwind config

### Debugging

- React DevTools for component inspection
- React Query DevTools for cache inspection
- Browser DevTools for network requests
- Zustand DevTools for state inspection

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)

