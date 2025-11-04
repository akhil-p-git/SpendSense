/**
 * ExportPDFButton Component
 * Handles PDF export for Operator Dashboard evaluation reports
 */

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUIStore } from '@/store/uiStore';
import apiService from '@/services/api';

export const ExportPDFButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useUIStore();

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Call the API endpoint with blob response type
      const blob = await apiService.exportEvaluationPDF();

      // Verify we got a blob (PDF)
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format from server');
      }

      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `spendsense-evaluation-${dateStr}.pdf`);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      // Show success message
      showToast('PDF exported successfully!', 'success');
    } catch (error: any) {
      console.error('Export failed:', error);
      
      // Extract error message
      let errorMessage = 'Failed to export PDF';
      
      // Handle different error types
      if (error?.response) {
        // Try to parse error from response
        const contentType = error.response.headers?.['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          // Response is JSON error
          try {
            const errorData = typeof error.response.data === 'string' 
              ? JSON.parse(error.response.data) 
              : error.response.data;
            errorMessage = errorData?.error || errorData?.message || errorMessage;
          } catch {
            // If parsing fails, use default message
            errorMessage = error.response.data?.error || errorMessage;
          }
        } else if (error.response.data instanceof Blob) {
          // Response is blob but might be an error
          errorMessage = 'Server error: Unable to generate PDF. Please check server logs.';
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Show error message
      showToast(errorMessage, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleExportPDF}
      disabled={isExporting}
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Export PDF Report</span>
        </>
      )}
    </Button>
  );
};

