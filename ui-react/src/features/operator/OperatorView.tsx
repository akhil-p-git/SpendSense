/**
 * OperatorView Component
 * Main operator dashboard view
 */

import React, { useState } from 'react';
import {
  PersonaDistributionCard,
  RecommendationTrackingCard,
  SystemHealthCard,
  OperatorFilters,
  OperatorUserList,
} from '@/components/operator';

export const OperatorView: React.FC = () => {
  const [filters, setFilters] = useState<{
    persona?: string;
    signal_type?: string;
    has_consent?: string;
  }>({});

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Operator Dashboard</h2>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PersonaDistributionCard />
        <RecommendationTrackingCard />
        <SystemHealthCard />
      </div>

      {/* Filters */}
      <OperatorFilters filters={filters} onFiltersChange={setFilters} />

      {/* User List */}
      <OperatorUserList filters={filters} />
    </div>
  );
};
