/**
 * Custom hooks for API calls using TanStack Query
 * Comprehensive hooks for all Flask endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/services/api';
import type {
  WhatIfScenario,
  ScenarioResult,
} from '@/types';

// ============================================================================
// QUERY HOOKS (GET requests)
// ============================================================================

/**
 * Health check endpoint
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /users - List all users
 */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * GET /profile/<user_id> - Get user profile with signals and persona
 */
export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => apiService.getProfile(userId!),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /recommendations/<user_id> - Get personalized recommendations
 */
export function useRecommendations(userId: string | null) {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => apiService.getRecommendations(userId!),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /users/<user_id>/accounts - Get user accounts
 */
export function useUserAccounts(userId: string | null) {
  return useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => apiService.getUserAccounts(userId!),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /transactions/<user_id> - Get user transactions
 */
export function useTransactions(userId: string | null) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => apiService.getTransactions(userId!),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * GET /operator/persona-distribution - Operator analytics
 */
export function usePersonaDistribution() {
  return useQuery({
    queryKey: ['persona-distribution'],
    queryFn: () => apiService.getPersonaDistribution(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /operator/recommendation-tracking - Recommendation tracking
 */
export function useRecommendationTracking() {
  return useQuery({
    queryKey: ['recommendation-tracking'],
    queryFn: () => apiService.getRecommendationTracking(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * GET /operator/system-health - System health metrics
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiService.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // 15 seconds
  });
}

/**
 * GET /operator/users - Get filtered operator users
 */
export function useOperatorUsers(filters?: {
  persona?: string;
  signal_type?: string;
  has_consent?: string;
}) {
  return useQuery({
    queryKey: ['operator-users', filters],
    queryFn: () => apiService.getOperatorUsers(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * GET /eval/report - Get evaluation report
 */
export function useEvaluationReport() {
  return useQuery({
    queryKey: ['evaluation-report'],
    queryFn: () => apiService.getEvaluationReport(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /history/recommendations/<user_id> - Get recommendation history
 */
export function useRecommendationHistory(userId: string | null, limit?: number) {
  return useQuery({
    queryKey: ['recommendation-history', userId, limit],
    queryFn: () => apiService.getRecommendationHistory(userId!, limit),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /history/persona/<user_id> - Get persona history
 */
export function usePersonaHistory(userId: string | null, limit?: number) {
  return useQuery({
    queryKey: ['persona-history', userId, limit],
    queryFn: () => apiService.getPersonaHistory(userId!, limit),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /history/acceptance-rate - Get acceptance rate trends
 */
export function useAcceptanceRateTrends(days?: number, userId?: string) {
  return useQuery({
    queryKey: ['acceptance-rate-trends', days, userId],
    queryFn: () => apiService.getAcceptanceRateTrends(days, userId),
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /history/persona-distribution - Get persona distribution history
 */
export function usePersonaDistributionHistory(days?: number) {
  return useQuery({
    queryKey: ['persona-distribution-history', days],
    queryFn: () => apiService.getPersonaDistributionHistory(days),
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /history/user-activity/<user_id> - Get user activity history
 */
export function useUserActivityHistory(userId: string | null, days?: number) {
  return useQuery({
    queryKey: ['user-activity-history', userId, days],
    queryFn: () => apiService.getUserActivityHistory(userId!, days),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * GET /session/user/<user_id> - Get user sessions
 */
export function useUserSessions(userId: string | null) {
  return useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: () => apiService.getUserSessions(userId!),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// MUTATION HOOKS (POST/PUT/DELETE requests)
// ============================================================================

/**
 * POST /what-if - Run what-if scenarios
 */
export function useWhatIfScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, scenario }: { userId: string; scenario: WhatIfScenario }) =>
      apiService.runWhatIfScenario(userId, scenario),
    onSuccess: (_data, variables) => {
      // Invalidate profile queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
}

/**
 * POST /what-if/export - Export scenarios as PDF/JSON
 */
export function useExportScenario() {
  return useMutation({
    mutationFn: async ({
      userId,
      scenarioResult,
      format,
    }: {
      userId: string;
      scenarioResult: ScenarioResult;
      format: 'pdf' | 'json';
    }) => {
      const response = await apiService.exportScenario(userId, scenarioResult, format);
      // For PDF, response is already a blob. For JSON, we need to convert to blob.
      if (format === 'json') {
        const jsonStr = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
        return new Blob([jsonStr], { type: 'application/json' });
      }
      return response as Blob;
    },
  });
}

/**
 * POST /consent - Update user consent
 */
export function useUpdateConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, consent }: { userId: string; consent: boolean }) =>
      apiService.updateConsent(userId, consent),
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['operator-users'] });
    },
  });
}

/**
 * POST /operator/recommendation/accept - Track recommendation acceptance
 */
export function useTrackRecommendationAcceptance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      recommendationId,
      type,
    }: {
      userId: string;
      recommendationId: string;
      type: string;
    }) => apiService.trackRecommendationAcceptance(userId, recommendationId, type),
    onMutate: async ({ type }) => {
      // Optimistic update: Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recommendation-tracking'] });
      
      // Snapshot the previous value
      const previousTracking = queryClient.getQueryData(['recommendation-tracking']);
      
      // Optimistically update the tracking data
      queryClient.setQueryData(['recommendation-tracking'], (old: any) => {
        if (!old) return old;
        
        const updated = { ...old };
        updated.total_acceptances = (updated.total_acceptances || 0) + 1;
        
        // Update by type
        if (updated.by_type && updated.by_type[type]) {
          updated.by_type[type] = {
            ...updated.by_type[type],
            acceptances: (updated.by_type[type].acceptances || 0) + 1,
            acceptance_rate: updated.by_type[type].acceptances 
              ? ((updated.by_type[type].acceptances + 1) / updated.by_type[type].views) * 100
              : 0,
          };
        }
        
        // Update overall acceptance rate
        updated.acceptance_rate = updated.total_views 
          ? (updated.total_acceptances / updated.total_views) * 100
          : 0;
        
        return updated;
      });
      
      // Return context with snapshot value
      return { previousTracking };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTracking) {
        queryClient.setQueryData(['recommendation-tracking'], context.previousTracking);
      }
    },
    onSuccess: () => {
      // Invalidate tracking queries to refetch from server
      queryClient.invalidateQueries({ queryKey: ['recommendation-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation-history'] });
      queryClient.invalidateQueries({ queryKey: ['acceptance-rate-trends'] });
    },
  });
}

/**
 * GET /operator/eval/export-pdf - Export evaluation report as PDF
 */
export function useExportEvaluationPDF() {
  return useMutation({
    mutationFn: () => apiService.exportEvaluationPDF(),
  });
}

/**
 * POST /session/create - Create a new user session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => apiService.createSession(userId),
    onSuccess: (_data, variables) => {
      // Invalidate user sessions query
      queryClient.invalidateQueries({ queryKey: ['user-sessions', variables.userId] });
    },
  });
}

/**
 * POST /session/validate - Validate a session token
 */
export function useValidateSession() {
  return useMutation({
    mutationFn: ({ sessionToken }: { sessionToken: string }) =>
      apiService.validateSession(sessionToken),
  });
}

/**
 * POST /session/deactivate - Deactivate a session
 */
export function useDeactivateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionToken }: { sessionToken: string; userId?: string }) =>
      apiService.deactivateSession(sessionToken),
    onSuccess: (_data, variables) => {
      // Invalidate user sessions query if userId provided
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['user-sessions', variables.userId] });
      }
    },
  });
}
