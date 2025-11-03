/**
 * OperatorFilters Component
 * Filter controls for operator dashboard
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useExportEvaluationPDF } from '@/hooks/useApi';

interface OperatorFiltersProps {
  filters: {
    persona?: string;
    signal_type?: string;
    has_consent?: string;
  };
  onFiltersChange: (filters: {
    persona?: string;
    signal_type?: string;
    has_consent?: string;
  }) => void;
}

export const OperatorFilters: React.FC<OperatorFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const exportPDF = useExportEvaluationPDF();

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportPDF.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Persona Filter */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="persona-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Persona
          </label>
          <select
            id="persona-filter"
            value={filters.persona || ''}
            onChange={(e) => handleFilterChange('persona', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Personas</option>
            <option value="High Utilization">High Utilization</option>
            <option value="Variable Income Budgeter">Variable Income Budgeter</option>
            <option value="Subscription-Heavy">Subscription-Heavy</option>
            <option value="Emergency Fund Starter">Emergency Fund Starter</option>
            <option value="Savings Builder">Savings Builder</option>
            <option value="Debt Optimizer">Debt Optimizer</option>
          </select>
        </div>

        {/* Signal Type Filter */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="signal-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Signal Type
          </label>
          <select
            id="signal-filter"
            value={filters.signal_type || ''}
            onChange={(e) => handleFilterChange('signal_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Signals</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Consent Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="consent-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Consent Status
          </label>
          <select
            id="consent-filter"
            value={filters.has_consent || ''}
            onChange={(e) => handleFilterChange('has_consent', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Users</option>
            <option value="true">Consented</option>
            <option value="false">Not Consented</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 items-end">
          <Button
            variant="secondary"
            onClick={handleClearFilters}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
          <Button
            variant="primary"
            onClick={handleExportPDF}
            disabled={exportPDF.isPending}
            className="whitespace-nowrap"
          >
            {exportPDF.isPending ? 'Exporting...' : 'Export PDF Report'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

