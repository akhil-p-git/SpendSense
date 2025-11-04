/**
 * WhatIfView Component
 * Main What-If simulator with scenario type tabs
 */

import React, { useState } from 'react';
import { ScenarioTabs } from '@/components/whatif/ScenarioTabs';
import { BasicScenariosTab } from '@/components/whatif/BasicScenariosTab';
import { GoalBasedPlanningTab } from '@/components/whatif/GoalBasedPlanningTab';
import { CombinedScenariosTab } from '@/components/whatif/CombinedScenariosTab';
import { CompareScenariosTab } from '@/components/whatif/CompareScenariosTab';
import { ExportButtons } from '@/components/whatif/ExportButtons';
import { useWhatIfScenario } from '@/hooks/useApi';

export const WhatIfView: React.FC = () => {
  const [activeScenarioTab, setActiveScenarioTab] = useState('basic');
  const whatIfScenario = useWhatIfScenario();

  const scenarioTabs = [
    { id: 'basic', label: 'Basic Scenarios' },
    { id: 'goal', label: 'Goal-Based Planning' },
    { id: 'combined', label: 'Combined Scenarios' },
    { id: 'compare', label: 'Compare Scenarios' },
  ];

  // Get current scenario result for export
  const currentScenarioResult = whatIfScenario.data;

  return (
    <div className="space-y-6">
      {/* Scenario Type Tabs */}
      <ScenarioTabs
        tabs={scenarioTabs}
        activeTab={activeScenarioTab}
        onTabChange={setActiveScenarioTab}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeScenarioTab === 'basic' && <BasicScenariosTab />}
        {activeScenarioTab === 'goal' && <GoalBasedPlanningTab />}
        {activeScenarioTab === 'combined' && <CombinedScenariosTab />}
        {activeScenarioTab === 'compare' && <CompareScenariosTab />}
      </div>

      {/* Export Buttons - Show when results exist */}
      <ExportButtons scenarioResult={currentScenarioResult || null} />
    </div>
  );
};
