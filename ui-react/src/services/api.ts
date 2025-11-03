/**
 * API service using Axios
 * Handles all HTTP requests to the Flask backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Account,
  Transaction,
  ProfileResponse,
  RecommendationsResponse,
  WhatIfScenario,
  ScenarioResult,
  PersonaDistribution,
  RecommendationTracking,
  SystemHealth,
  EvaluationReport,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any auth tokens or headers here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        
        // Don't retry if already retried or if it's not a network error
        if (!config || config.__retryCount >= 3) {
          return Promise.reject(error);
        }

        // Only retry on network errors or 5xx errors
        if (
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600)
        ) {
          config.__retryCount = config.__retryCount || 0;
          config.__retryCount += 1;

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, config.__retryCount - 1) * 1000;
          
          await new Promise((resolve) => setTimeout(resolve, delay));
          
          return this.client(config);
        }

        // Handle common errors
        if (error.response) {
          // Server responded with error status
          const message = (error.response.data as any)?.error || error.message;
          return Promise.reject(new Error(message));
        } else if (error.request) {
          // Request made but no response
          return Promise.reject(new Error('No response from server'));
        } else {
          // Something else happened
          return Promise.reject(error);
        }
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get<{
      status: string;
      message: string;
      endpoints: Record<string, string>;
    }>('/api/health');
    return response.data;
  }

  // Users
  async getUsers() {
    const response = await this.client.get<{ total_users: number; users: User[] }>('/users');
    return response.data;
  }

  // Profile
  async getProfile(userId: string) {
    const response = await this.client.get<ProfileResponse>(`/profile/${userId}`);
    return response.data;
  }

  // Recommendations
  async getRecommendations(userId: string) {
    const response = await this.client.get<RecommendationsResponse>(`/recommendations/${userId}`);
    return response.data;
  }

  async trackRecommendationAcceptance(userId: string, recommendationId: string, type: string) {
    const response = await this.client.post('/operator/recommendation/accept', {
      user_id: userId,
      recommendation_id: recommendationId,
      type,
      action: 'clicked',
    });
    return response.data;
  }

  // Accounts
  async getUserAccounts(userId: string) {
    const response = await this.client.get<{ user_id: string; total_accounts: number; accounts: Account[] }>(
      `/users/${userId}/accounts`
    );
    return response.data;
  }

  // Transactions
  async getTransactions(userId: string) {
    const response = await this.client.get<{ user_id: string; total_transactions: number; transactions: Transaction[] }>(
      `/transactions/${userId}`
    );
    return response.data;
  }

  // What-If Simulator
  async runWhatIfScenario(userId: string, scenario: WhatIfScenario) {
    const response = await this.client.post<ScenarioResult>('/what-if', {
      user_id: userId,
      scenario_type: scenario.scenario_type,
      params: scenario.params,
    });
    return response.data;
  }

  async exportScenario(userId: string, scenarioResult: ScenarioResult, format: 'pdf' | 'json'): Promise<Blob | string> {
    const response = await this.client.post(
      '/what-if/export',
      {
        scenario_result: scenarioResult,
        user_id: userId,
        format,
      },
      {
        responseType: format === 'pdf' ? 'blob' : 'json',
      }
    );
    return response.data;
  }

  // Consent
  async updateConsent(userId: string, consent: boolean) {
    const response = await this.client.post('/consent', {
      user_id: userId,
      consent,
    });
    return response.data;
  }

  // Operator Analytics
  async getPersonaDistribution() {
    const response = await this.client.get<PersonaDistribution>('/operator/persona-distribution');
    return response.data;
  }

  async getRecommendationTracking() {
    const response = await this.client.get<RecommendationTracking>('/operator/recommendation-tracking');
    return response.data;
  }

  async getSystemHealth() {
    const response = await this.client.get<SystemHealth>('/operator/system-health');
    return response.data;
  }

  async getOperatorUsers(filters?: {
    persona?: string;
    signal_type?: string;
    has_consent?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.persona) params.append('persona', filters.persona);
    if (filters?.signal_type) params.append('signal_type', filters.signal_type);
    if (filters?.has_consent) params.append('has_consent', filters.has_consent);

    const response = await this.client.get<{
      total_users: number;
      filters_applied: Record<string, string | undefined>;
      users: User[];
    }>(`/operator/users?${params.toString()}`);
    return response.data;
  }

  async exportEvaluationPDF() {
    const response = await this.client.get('/operator/eval/export-pdf', {
      responseType: 'blob',
    });
    return response.data;
  }

  // Evaluation
  async getEvaluationReport() {
    const response = await this.client.get<EvaluationReport>('/eval/report');
    return response.data;
  }

  // History
  async getRecommendationHistory(userId: string, limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.client.get(`/history/recommendations/${userId}${params}`);
    return response.data;
  }

  async getPersonaHistory(userId: string, limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.client.get(`/history/persona/${userId}${params}`);
    return response.data;
  }

  async getAcceptanceRateTrends(days?: number, userId?: string) {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (userId) params.append('user_id', userId);
    const response = await this.client.get(`/history/acceptance-rate?${params.toString()}`);
    return response.data;
  }

  async getPersonaDistributionHistory(days?: number) {
    const params = days ? `?days=${days}` : '';
    const response = await this.client.get(`/history/persona-distribution${params}`);
    return response.data;
  }

  async getUserActivityHistory(userId: string, days?: number) {
    const params = days ? `?days=${days}` : '';
    const response = await this.client.get(`/history/user-activity/${userId}${params}`);
    return response.data;
  }

  // Sessions
  async createSession(userId: string) {
    const response = await this.client.post('/session/create', { user_id: userId });
    return response.data;
  }

  async validateSession(sessionToken: string) {
    const response = await this.client.post('/session/validate', { session_token: sessionToken });
    return response.data;
  }

  async deactivateSession(sessionToken: string) {
    const response = await this.client.post('/session/deactivate', { session_token: sessionToken });
    return response.data;
  }

  async getUserSessions(userId: string) {
    const response = await this.client.get(`/session/user/${userId}`);
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;

