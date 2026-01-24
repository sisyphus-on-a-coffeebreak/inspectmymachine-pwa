/**
 * ExportButton Component
 * 
 * Reusable button component for exporting data in multiple formats
 */

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { Button } from './button';
import { colors, spacing } from '../../lib/theme';
import { exportData, exportFromAPI } from '../../lib/exportUtils';
import type { ExportFormat, ExportOptions } from '../../lib/exportUtils';
import { useToast } from '../../providers/ToastProvider';
import { exportService } from '../../lib/services/ExportService';

export interface ExportButtonProps {
  data?: Record<string, any>[] | Record<string, any>;
  apiEndpoint?: string;
  apiParams?: Record<string, any>;
  formats?: ExportFormat[];
  options?: ExportOptions;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  showTemplates?: boolean;
  module?: 'gate_pass' | 'expense' | 'inspection' | 'user' | 'all';
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText size={16} />,
  excel: <FileSpreadsheet size={16} />,
  json: <FileJson size={16} />,
};

const formatLabels: Record<ExportFormat, string> = {
  csv: 'CSV',
  excel: 'Excel',
  json: 'JSON',
};

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  apiEndpoint,
  apiParams,
  formats = ['csv', 'excel', 'json'],
  options = {},
  label = 'Export',
  variant = 'secondary',
  size = 'md',
  showDropdown = true,
  showTemplates = false,
  module,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { showToast } = useToast();
  
  const templates = (showTemplates && module) ? exportService.getTemplates(module) : [];

  const handleExport = async (format: ExportFormat, templateId?: string) => {
    if (!data && !apiEndpoint) {
      showToast({
        title: 'Error',
        description: 'No data or API endpoint provided for export',
        variant: 'error',
      });
      return;
    }

    setIsExporting(true);
    setShowMenu(false);

    try {
      if (templateId) {
        await exportService.exportWithTemplate(templateId, Array.isArray(data) ? data : undefined, apiEndpoint, apiParams);
      } else if (apiEndpoint) {
        await exportFromAPI(apiEndpoint, format, apiParams, options);
      } else if (data) {
        await exportData(Array.isArray(data) ? data : [data], format, options);
      }

      showToast({
        title: 'Success',
        description: templateId 
          ? 'Data exported using template'
          : `Data exported as ${formatLabels[format]}`,
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // If only one format or dropdown disabled, show single button
  if (formats.length === 1 || !showDropdown) {
    const format = formats[0];
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(format)}
        disabled={isExporting}
        icon={isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      >
        {isExporting ? 'Exporting...' : label}
      </Button>
    );
  }

  // Multiple formats - show dropdown
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        icon={isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      >
        {isExporting ? 'Exporting...' : label}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown Menu */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: spacing.xs,
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: `1px solid ${colors.neutral[200]}`,
              zIndex: 1000,
              minWidth: '150px',
              overflow: 'hidden',
            }}
          >
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={isExporting}
                style={{
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.md}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  color: colors.neutral[900],
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isExporting) {
                    e.currentTarget.style.backgroundColor = colors.neutral[50];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {formatIcons[format]}
                {formatLabels[format]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


