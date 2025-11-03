/**
 * OperatorUserList Component
 * Displays filtered users in a table
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useOperatorUsers } from '@/hooks/useApi';

interface OperatorUserListProps {
  filters: {
    persona?: string;
    signal_type?: string;
    has_consent?: string;
  };
}

// Persona color mapping
const getPersonaColor = (persona: string): string => {
  const personaColors: Record<string, string> = {
    'High Utilization': 'bg-red-100 text-red-800',
    'Variable Income Budgeter': 'bg-yellow-100 text-yellow-800',
    'Subscription-Heavy': 'bg-purple-100 text-purple-800',
    'Emergency Fund Starter': 'bg-orange-100 text-orange-800',
    'Savings Builder': 'bg-green-100 text-green-800',
    'Debt Optimizer': 'bg-blue-100 text-blue-800',
  };
  return personaColors[persona] || 'bg-gray-100 text-gray-800';
};

export const OperatorUserList: React.FC<OperatorUserListProps> = ({ filters }) => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useOperatorUsers(filters);

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}/recommendations`);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load users'} />
      </Card>
    );
  }

  if (!data || !data.users || data.users.length === 0) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-8">No users found matching filters</p>
      </Card>
    );
  }

  const formatSignalsSummary = (user: any): string => {
    const signals = [];
    if (user.has_subscription_signal) signals.push('Subscriptions');
    if (user.has_savings_signal) signals.push('Savings');
    if (user.has_credit_signal) signals.push('Credit');
    if (user.has_income_signal) signals.push('Income');
    return signals.length > 0 ? signals.join(', ') : 'None';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        <span className="text-sm text-gray-500">{data.users.length} users</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Persona
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consent Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Signals Summary
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.users.map((user: any) => (
              <tr
                key={user.user_id}
                onClick={() => handleUserClick(user.user_id)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {user.name || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {user.email || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPersonaColor(
                      user.persona || 'Unknown'
                    )}`}
                  >
                    {user.persona || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.consent
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.consent ? 'Consented' : 'Not Consented'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatSignalsSummary(user)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

