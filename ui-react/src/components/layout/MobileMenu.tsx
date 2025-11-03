/**
 * MobileMenu Component
 * Hamburger menu for mobile navigation
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useUserStore } from '@/store/userStore';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserId } = useUserStore();
  const { setActiveTab } = useStore();

  const tabs = [
    { id: 'recommendations', label: 'Recommendations', path: currentUserId ? `/users/${currentUserId}/recommendations` : null },
    { id: 'whatif', label: 'What-If Simulator', path: currentUserId ? `/users/${currentUserId}/whatif` : null },
    { id: 'transactions', label: 'Transactions', path: currentUserId ? `/users/${currentUserId}/transactions` : null },
    { id: 'operator', label: 'Operator View', path: '/operator' },
  ];

  const handleTabClick = (tabId: string, path: string | null) => {
    if (path) {
      navigate(path);
      setActiveTab(tabId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabClick(tab.id, tab.path)}
                    disabled={!tab.path}
                    className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      location.pathname === tab.path || location.pathname.includes(tab.id)
                        ? 'bg-primary-50 text-primary-700'
                        : tab.path
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    aria-current={location.pathname === tab.path ? 'page' : undefined}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

