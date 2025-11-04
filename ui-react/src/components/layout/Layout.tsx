/**
 * Main Layout Component
 * Mint-style design with header, tabs, and content area
 */

import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Tabs } from './Tabs';
import { useStore } from '@/store/useStore';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export const Layout: React.FC = () => {
  const { error, clearError, activeTab, setActiveTab } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/recommendations')) {
      setActiveTab('recommendations');
    } else if (path.includes('/whatif')) {
      setActiveTab('whatif');
    } else if (path.includes('/transactions')) {
      setActiveTab('transactions');
    } else if (path.includes('/operator')) {
      setActiveTab('operator');
    } else if (path.includes('/profile')) {
      setActiveTab('profile');
    }
  }, [location.pathname, setActiveTab]);

  // Tab definitions
  const tabs = [
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'whatif', label: 'What-If Simulator' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'operator', label: 'Operator View' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const { currentUserId } = useStore.getState();
    
    if (tabId === 'operator') {
      navigate('/operator');
    } else if (currentUserId) {
      if (tabId === 'recommendations') {
        navigate(`/users/${currentUserId}/recommendations`);
      } else if (tabId === 'whatif') {
        navigate(`/users/${currentUserId}/whatif`);
      } else if (tabId === 'transactions') {
        navigate(`/users/${currentUserId}/transactions`);
      }
    } else {
      // No user selected - navigate to home to show user selection prompt
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={clearError} />
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Content Area */}
        <main className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

