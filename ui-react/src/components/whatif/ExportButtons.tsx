/**
 * ExportButtons Component
 * Export scenario results as PDF or JSON
 */

import React from 'react';
import { useExportScenario } from '@/hooks/useApi';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/common/Button';
import type { ScenarioResult } from '@/types';

interface ExportButtonsProps {
  scenarioResult: ScenarioResult | null;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ scenarioResult }) => {
  const { currentUserId } = useStore();
  const exportScenario = useExportScenario();

  const handleExport = async (format: 'pdf' | 'json') => {
    if (!scenarioResult || !currentUserId) return;

    try {
      const blob = await exportScenario.mutateAsync({
        userId: currentUserId,
        scenarioResult,
        format,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scenario_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!scenarioResult) {
    return null;
  }

  return (
    <div className="flex gap-3 justify-end mt-6">
      <Button
        variant="secondary"
        onClick={() => handleExport('json')}
        disabled={exportScenario.isPending}
      >
        {exportScenario.isPending ? 'Exporting...' : 'Export as JSON'}
      </Button>
      <Button
        variant="secondary"
        onClick={() => handleExport('pdf')}
        disabled={exportScenario.isPending}
      >
        {exportScenario.isPending ? 'Exporting...' : 'Export as PDF'}
      </Button>
    </div>
  );
};

