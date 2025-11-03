/**
 * Zustand store for global state management
 */

import { create } from 'zustand';
import type { User, ProfileResponse, RecommendationsResponse } from '@/types';

interface AppState {
  // Current user
  currentUserId: string | null;
  currentUser: User | null;
  currentProfile: ProfileResponse | null;
  currentRecommendations: RecommendationsResponse | null;
  
  // UI state
  activeTab: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentUserId: (userId: string | null) => void;
  setCurrentUser: (user: User | null) => void;
  setCurrentProfile: (profile: ProfileResponse | null) => void;
  setCurrentRecommendations: (recommendations: RecommendationsResponse | null) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  currentUserId: null,
  currentUser: null,
  currentProfile: null,
  currentRecommendations: null,
  activeTab: 'recommendations',
  isLoading: false,
  error: null,

  // Actions
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  setCurrentRecommendations: (recommendations) => set({ currentRecommendations: recommendations }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

