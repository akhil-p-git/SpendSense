/**
 * TypeScript type definitions for SpendSense
 */

export interface User {
  user_id: string;
  name: string;
  email: string;
  consent: boolean;
  income_level?: string;
  created_at?: string;
}

export interface Account {
  account_id: string;
  user_id: string;
  type: string;
  subtype?: string;
  balance_current: number;
  balance_available?: number;
  balance_limit?: number;
  iso_currency_code: string;
  holder_category?: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  date: string;
  amount: number;
  merchant_name?: string;
  payment_channel?: string;
  category_primary?: string;
  category_detailed?: string;
  pending?: boolean;
}

export interface Liability {
  liability_id?: number;
  account_id: string;
  user_id: string;
  type?: string;
  apr?: number;
  minimum_payment?: number;
  last_payment_date?: string;
  last_payment_amount?: number;
}

export interface BehavioralSignal {
  subscriptions?: {
    num_recurring_merchants?: number;
    monthly_recurring_spend?: number;
    [key: string]: any;
  };
  savings?: {
    current_savings_balance?: number;
    monthly_savings_inflow?: number;
    emergency_fund_coverage?: number;
    [key: string]: any;
  };
  credit?: {
    has_credit_card?: boolean;
    max_utilization?: number;
    total_credit_balance?: number;
    [key: string]: any;
  };
  income?: {
    [key: string]: any;
  };
}

export interface Persona {
  primary_persona: string;
  persona_name: string;
  primary_focus: string;
  confidence?: number;
}

export interface Recommendation {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  type: 'education' | 'partner_offer';
  rationale: string;
  decision_trace?: string[];
  persona?: string;
}

export interface RecommendationsResponse {
  user_id: string;
  persona: string;
  persona_focus: string;
  education: Recommendation[];
  offers: Recommendation[];
  disclaimer: string;
  timestamp: string;
}

export interface ProfileResponse {
  user_id: string;
  name: string;
  signals: BehavioralSignal;
  persona: Persona;
  rationale?: string;
}

export interface WhatIfScenario {
  scenario_type: 
    | 'extra_credit_payment' 
    | 'subscription_cancellation' 
    | 'increased_savings' 
    | 'combined' 
    | 'goal_based_payment' 
    | 'compare';
  params: Record<string, any>;
}

export interface ScenarioResult {
  scenario_type: string;
  [key: string]: any;
}

export interface PersonaDistribution {
  total_users: number;
  distribution: Record<string, {
    count: number;
    percentage: number;
  }>;
}

export interface RecommendationTracking {
  total_views: number;
  total_acceptances: number;
  acceptance_rate: number;
  by_type: Record<string, {
    views: number;
    acceptances: number;
    acceptance_rate: number;
  }>;
  by_persona: Record<string, {
    views: number;
    acceptances: number;
    acceptance_rate: number;
  }>;
}

export interface SystemHealth {
  uptime_seconds: number;
  latency: {
    avg_seconds: number;
    max_seconds: number;
    min_seconds: number;
    target_met: boolean;
  };
  users: {
    total: number;
    with_consent: number;
    consent_rate_percent: number;
  };
  recommendations: {
    total_generated: number;
    total_views: number;
    total_acceptances: number;
    acceptance_rate_percent: number;
  };
  api_calls: {
    total: number;
    avg_per_minute: number;
  };
}

export interface EvaluationReport {
  timestamp: string;
  coverage: {
    total_users: number;
    users_with_persona: number;
    users_with_3plus_behaviors: number;
    users_fully_covered: number;
    coverage_percent: number;
    target_met: boolean;
  };
  explainability: {
    total_recommendations: number;
    recommendations_with_rationale: number;
    explainability_percent: number;
    target_met: boolean;
  };
  latency: {
    avg_latency: number;
    max_latency: number;
    min_latency: number;
    target_met: boolean;
  };
  auditability: {
    total_recommendations: number;
    recommendations_with_trace: number;
    auditability_percent: number;
    target_met: boolean;
  };
  overall_score: number;
  targets_met: string;
}

