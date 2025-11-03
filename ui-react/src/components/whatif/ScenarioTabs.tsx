/**
 * ScenarioTabs Component
 * Tab navigation for What-If scenario types
 */

import React from 'react';

interface ScenarioTab {
  id: string;
  label: string;
}

interface ScenarioTabsProps {
  tabs: ScenarioTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const ScenarioTabs: React.FC<ScenarioTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap
            border-b-3 -mb-0.5
            ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-3 border-primary-600 font-semibold'
                : 'text-gray-600 border-b-3 border-transparent hover:text-primary-600 hover:border-primary-300'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

