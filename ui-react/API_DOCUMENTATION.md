# API Service Layer Documentation

Complete API service layer for SpendSense React frontend that mirrors all Flask backend endpoints.

## Overview

The API service layer consists of two main parts:
1. **API Service** (`/src/services/api.ts`) - Axios-based service class with all endpoint methods
2. **React Query Hooks** (`/src/hooks/useApi.ts`) - Custom hooks for easy integration with React components

## Features

- ✅ **TypeScript** - Full type safety with proper interfaces
- ✅ **Error Handling** - Centralized error handling with interceptors
- ✅ **React Query Integration** - Automatic caching, refetching, and state management
- ✅ **Query Invalidation** - Automatic cache invalidation on mutations
- ✅ **Stale Time Configuration** - Optimized cache times for different endpoints

## API Endpoints

### Health Check

**GET** `/api/health`
- **Hook**: `useHealthCheck()`
- **Description**: Health check endpoint
- **Stale Time**: 60 seconds

### Users

**GET** `/users`
- **Hook**: `useUsers()`
- **Description**: List all users
- **Stale Time**: 30 seconds
- **Response**: `{ total_users: number; users: User[] }`

### Profile

**GET** `/profile/<user_id>`
- **Hook**: `useProfile(userId: string | null)`
- **Description**: Get user profile with signals and persona
- **Stale Time**: 60 seconds
- **Response**: `ProfileResponse`

### Recommendations

**GET** `/recommendations/<user_id>`
- **Hook**: `useRecommendations(userId: string | null)`
- **Description**: Get personalized recommendations
- **Stale Time**: 60 seconds
- **Response**: `RecommendationsResponse`

### Accounts

**GET** `/users/<user_id>/accounts`
- **Hook**: `useUserAccounts(userId: string | null)`
- **Description**: Get user accounts
- **Stale Time**: 60 seconds
- **Response**: `{ user_id: string; total_accounts: number; accounts: Account[] }`

### Transactions

**GET** `/transactions/<user_id>`
- **Hook**: `useTransactions(userId: string | null)`
- **Description**: Get user transactions
- **Stale Time**: 30 seconds
- **Response**: `{ user_id: string; total_transactions: number; transactions: Transaction[] }`

### What-If Simulator

**POST** `/what-if`
- **Hook**: `useWhatIfScenario()` (mutation)
- **Description**: Run what-if scenarios
- **Parameters**: `{ userId: string; scenario: WhatIfScenario }`
- **Response**: `ScenarioResult`

**POST** `/what-if/export`
- **Hook**: `useExportScenario()` (mutation)
- **Description**: Export scenarios as PDF/JSON
- **Parameters**: `{ userId: string; scenarioResult: ScenarioResult; format: 'pdf' | 'json' }`
- **Response**: Blob (PDF) or JSON

### Consent

**POST** `/consent`
- **Hook**: `useUpdateConsent()` (mutation)
- **Description**: Update user consent
- **Parameters**: `{ userId: string; consent: boolean }`
- **Invalidates**: `['users', 'profile', 'operator-users']`

### Operator Analytics

**GET** `/operator/persona-distribution`
- **Hook**: `usePersonaDistribution()`
- **Description**: Get persona distribution across all users
- **Stale Time**: 60 seconds
- **Response**: `PersonaDistribution`

**GET** `/operator/recommendation-tracking`
- **Hook**: `useRecommendationTracking()`
- **Description**: Get recommendation tracking metrics
- **Stale Time**: 30 seconds
- **Response**: `RecommendationTracking`

**GET** `/operator/system-health`
- **Hook**: `useSystemHealth()`
- **Description**: Get system health metrics
- **Refetch Interval**: 30 seconds
- **Stale Time**: 15 seconds
- **Response**: `SystemHealth`

**GET** `/operator/users`
- **Hook**: `useOperatorUsers(filters?)`
- **Description**: Get filtered operator users
- **Stale Time**: 30 seconds
- **Filters**: `{ persona?: string; signal_type?: string; has_consent?: string }`
- **Response**: `{ total_users: number; filters_applied: Record<string, string>; users: User[] }`

**POST** `/operator/recommendation/accept`
- **Hook**: `useTrackRecommendationAcceptance()` (mutation)
- **Description**: Track recommendation acceptance
- **Parameters**: `{ userId: string; recommendationId: string; type: string }`
- **Invalidates**: `['recommendation-tracking', 'recommendation-history', 'acceptance-rate-trends']`

**GET** `/operator/eval/export-pdf`
- **Hook**: `useExportEvaluationPDF()` (mutation)
- **Description**: Export evaluation report as PDF
- **Response**: Blob (PDF)

### Evaluation

**GET** `/eval/report`
- **Hook**: `useEvaluationReport()`
- **Description**: Get evaluation report
- **Stale Time**: 60 seconds
- **Response**: `EvaluationReport`

### History

**GET** `/history/recommendations/<user_id>`
- **Hook**: `useRecommendationHistory(userId: string | null, limit?: number)`
- **Description**: Get recommendation history for a user
- **Stale Time**: 60 seconds

**GET** `/history/persona/<user_id>`
- **Hook**: `usePersonaHistory(userId: string | null, limit?: number)`
- **Description**: Get persona history for a user
- **Stale Time**: 60 seconds

**GET** `/history/acceptance-rate`
- **Hook**: `useAcceptanceRateTrends(days?: number, userId?: string)`
- **Description**: Get acceptance rate trends
- **Stale Time**: 60 seconds

**GET** `/history/persona-distribution`
- **Hook**: `usePersonaDistributionHistory(days?: number)`
- **Description**: Get persona distribution history
- **Stale Time**: 60 seconds

**GET** `/history/user-activity/<user_id>`
- **Hook**: `useUserActivityHistory(userId: string | null, days?: number)`
- **Description**: Get user activity history
- **Stale Time**: 60 seconds

### Sessions

**POST** `/session/create`
- **Hook**: `useCreateSession()` (mutation)
- **Description**: Create a new user session
- **Parameters**: `{ userId: string }`
- **Invalidates**: `['user-sessions']`

**POST** `/session/validate`
- **Hook**: `useValidateSession()` (mutation)
- **Description**: Validate a session token
- **Parameters**: `{ sessionToken: string }`

**POST** `/session/deactivate`
- **Hook**: `useDeactivateSession()` (mutation)
- **Description**: Deactivate a session
- **Parameters**: `{ sessionToken: string; userId?: string }`
- **Invalidates**: `['user-sessions']` (if userId provided)

**GET** `/session/user/<user_id>`
- **Hook**: `useUserSessions(userId: string | null)`
- **Description**: Get user sessions
- **Stale Time**: 30 seconds

## Usage Examples

### Query Hooks (GET requests)

```typescript
import { useUsers, useProfile, useRecommendations } from '@/hooks/useApi';

function MyComponent() {
  const { data: users, isLoading, error } = useUsers();
  const { data: profile } = useProfile('user_0001');
  const { data: recommendations } = useRecommendations('user_0001');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Your component */}</div>;
}
```

### Mutation Hooks (POST requests)

```typescript
import { useUpdateConsent, useWhatIfScenario } from '@/hooks/useApi';

function MyComponent() {
  const updateConsent = useUpdateConsent();
  const whatIfScenario = useWhatIfScenario();

  const handleUpdateConsent = () => {
    updateConsent.mutate({
      userId: 'user_0001',
      consent: true,
    });
  };

  const handleRunScenario = () => {
    whatIfScenario.mutate({
      userId: 'user_0001',
      scenario: {
        scenario_type: 'extra_credit_payment',
        params: {
          account_id: 'acc_001',
          extra_monthly_payment: 200,
          months: 12,
        },
      },
    });
  };

  return (
    <div>
      <button onClick={handleUpdateConsent}>Update Consent</button>
      <button onClick={handleRunScenario}>Run Scenario</button>
      {whatIfScenario.isPending && <div>Running scenario...</div>}
      {whatIfScenario.data && <div>Result: {JSON.stringify(whatIfScenario.data)}</div>}
    </div>
  );
}
```

## Error Handling

All API calls have centralized error handling through Axios interceptors. Errors are automatically converted to Error objects with descriptive messages.

```typescript
const { data, error, isError } = useUsers();

if (isError) {
  // error.message contains the error message
  console.error(error.message);
}
```

## Cache Management

React Query automatically manages caching with the following strategies:

- **Stale Time**: How long data is considered fresh (varies by endpoint)
- **Refetch Interval**: Automatic refetching for real-time data (e.g., system health)
- **Query Invalidation**: Automatic cache invalidation on mutations

## TypeScript Types

All endpoints have full TypeScript type definitions in `/src/types/index.ts`. This ensures type safety throughout the application.

## Configuration

The API base URL can be configured via environment variable:
- `VITE_API_URL` - Defaults to `http://localhost:8000`

Set in `.env` file:
```
VITE_API_URL=http://localhost:8000
```

