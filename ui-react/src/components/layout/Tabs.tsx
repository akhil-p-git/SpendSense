/**
 * Tabs Component
 * Reusable tab navigation with keyboard support
 */

import React, { useEffect, useRef } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    // Focus active tab on mount
    if (activeIndex >= 0 && tabRefs.current[tabs[activeIndex].id]) {
      tabRefs.current[tabs[activeIndex].id]?.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = index > 0 ? index - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = index < tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabs[newIndex];
    onTabChange(newTab.id);
    tabRefs.current[newTab.id]?.focus();
  };

  return (
    <div className="border-b border-gray-200" role="tablist" aria-label="Navigation tabs">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm min-h-[44px] min-w-[44px]
              transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
