/**
 * Scenario Store
 * Manages What-If scenario results and active scenario type
 */

import { create } from 'zustand';
import type { ScenarioResult } from '@/types';

interface ScenarioState {
  activeScenarioType: string;
  scenarioResults: Record<string, ScenarioResult | null>;
  currentScenarioResult: ScenarioResult | null;
  setActiveScenarioType: (type: string) => void;
  setScenarioResult: (scenarioType: string, result: ScenarioResult | null) => void;
  setCurrentScenarioResult: (result: ScenarioResult | null) => void;
  clearScenarioResults: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  activeScenarioType: 'basic',
  scenarioResults: {},
  currentScenarioResult: null,
  setActiveScenarioType: (type) => set({ activeScenarioType: type }),
  setScenarioResult: (scenarioType, result) =>
    set((state) => ({
      scenarioResults: { ...state.scenarioResults, [scenarioType]: result },
      currentScenarioResult: state.activeScenarioType === scenarioType ? result : state.currentScenarioResult,
    })),
  setCurrentScenarioResult: (result) => set({ currentScenarioResult: result }),
  clearScenarioResults: () => set({ scenarioResults: {}, currentScenarioResult: null }),
}));

