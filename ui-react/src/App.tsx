/**
 * Main App Component
 * Sets up React Query, React Router, and Layout
 */

import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToastContainer } from '@/components/common/Toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { HomePage } from '@/pages/HomePage';

// Lazy load pages for code splitting
const UserRecommendationsPage = lazy(() => import('@/pages/UserRecommendationsPage').then(m => ({ default: m.UserRecommendationsPage })));
const UserWhatIfPage = lazy(() => import('@/pages/UserWhatIfPage').then(m => ({ default: m.UserWhatIfPage })));
const UserTransactionsPage = lazy(() => import('@/pages/UserTransactionsPage').then(m => ({ default: m.UserTransactionsPage })));
const OperatorPage = lazy(() => import('@/pages/OperatorPage').then(m => ({ default: m.OperatorPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds default stale time
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route
                  path="users/:userId/recommendations"
                  element={
                    <Suspense fallback={<LoadingSpinner size="lg" />}>
                      <UserRecommendationsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="users/:userId/whatif"
                  element={
                    <Suspense fallback={<LoadingSpinner size="lg" />}>
                      <UserWhatIfPage />
                    </Suspense>
                  }
                />
                <Route
                  path="users/:userId/transactions"
                  element={
                    <Suspense fallback={<LoadingSpinner size="lg" />}>
                      <UserTransactionsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="operator"
                  element={
                    <Suspense fallback={<LoadingSpinner size="lg" />}>
                      <OperatorPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
