/**
 * Audit Reports Page
 * 
 * Generate and view compliance reports.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { LoadingError } from '@/components/ui/LoadingError';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import {
  getReportDefinitions,
  getGeneratedReports,
  generateReport,
  downloadReport,
  deleteReport,
  getStatusColor,
  getStatusLabel,
  formatFileSize,
  type ReportDefinition,
  type GeneratedReport,
  type ReportType,
} from '@/lib/auditReports';
import { formatRelativeTime } from '@/lib/sessions';
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '@/lib/theme';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Calendar,
} from 'lucide-react';

// Query key
const queryKeys = {
  reports: ['audit-reports'],
};

export function AuditReports() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportDefinition | null>(null);
  const [reportParams, setReportParams] = useState<Record<string, unknown>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<GeneratedReport | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Fetch generated reports
  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.reports,
    queryFn: () => getGeneratedReports({ per_page: 50 }),
  });
  
  const reports = reportsData?.data || [];
  const reportDefinitions = getReportDefinitions();
  
  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: ({ type, params }: { type: ReportType; params: Record<string, unknown> }) =>
      generateReport(type, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      showToast({
        title: 'Report Queued',
        description: 'Your report is being generated. It will appear in the list when ready.',
        variant: 'success',
      });
      setShowNewReportModal(false);
      setSelectedReportType(null);
      setReportParams({});
    },
    onError: (error) => {
      showToast({
        title: 'Failed to Generate Report',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      });
    },
  });
  
  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      showToast({
        title: 'Report Deleted',
        description: 'The report has been deleted.',
        variant: 'success',
      });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      showToast({
        title: 'Failed to Delete Report',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      });
    },
  });
  
  // Handle download
  const handleDownload = async (report: GeneratedReport) => {
    if (report.status !== 'completed' || !report.file_url) return;
    
    setDownloadingId(report.id);
    try {
      const blob = await downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '-').toLowerCase()}-${report.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showToast({
        title: 'Download Failed',
        description: 'Failed to download the report.',
        variant: 'error',
      });
    } finally {
      setDownloadingId(null);
    }
  };
  
  // Handle generate
  const handleGenerate = () => {
    if (!selectedReportType) return;
    generateMutation.mutate({
      type: selectedReportType.type,
      params: reportParams,
    });
  };
  
  // Get status icon
  const StatusIcon = ({ status }: { status: GeneratedReport['status'] }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} color={getStatusColor(status)} />;
      case 'generating':
      case 'pending':
        return <Loader size={18} color={getStatusColor(status)} className="animate-spin" />;
      case 'failed':
        return <XCircle size={18} color={getStatusColor(status)} />;
      default:
        return <Clock size={18} color={colors.neutral[400]} />;
    }
  };
  
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Audit Reports"
        subtitle="Generate and download compliance reports"
        icon={<FileText size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/admin' },
          { label: 'Audit Reports' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              icon={<RefreshCw size={18} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowNewReportModal(true)}
              icon={<Plus size={18} />}
            >
              New Report
            </Button>
          </div>
        }
      />
      
      {/* Report Templates */}
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.lg }}>
          Available Reports
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: spacing.lg,
          }}
        >
          {reportDefinitions.map((def) => (
            <div
              key={def.type}
              onClick={() => {
                setSelectedReportType(def);
                setReportParams({});
                setShowNewReportModal(true);
              }}
              style={{
                ...cardStyles.base,
                padding: spacing.lg,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1px solid ${colors.neutral[200]}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[200];
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: spacing.md }}>
                {def.icon}
              </div>
              <h3 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.xs }}>
                {def.name}
              </h3>
              <p style={{ ...typography.caption, color: colors.neutral[600], margin: 0 }}>
                {def.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Generated Reports */}
      <div>
        <h2 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.lg }}>
          Generated Reports
        </h2>
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <LoadingError
            resource="reports"
            error={error}
            onRetry={() => refetch()}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No Reports Generated"
            description="Generate your first report by clicking on one of the templates above."
            icon="📊"
          />
        ) : (
          <div style={{ ...cardStyles.base, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.neutral[50] }}>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Report
                  </th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Status
                  </th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Generated By
                  </th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Size
                  </th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Created
                  </th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'right', fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    style={{ borderTop: `1px solid ${colors.neutral[200]}` }}
                  >
                    <td style={{ padding: spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <span style={{ fontSize: '20px' }}>
                          {reportDefinitions.find(d => d.type === report.type)?.icon || '📄'}
                        </span>
                        <div>
                          <p style={{ ...typography.body, fontWeight: 500, color: colors.neutral[900], margin: 0 }}>
                            {report.name}
                          </p>
                          {report.row_count !== undefined && (
                            <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
                              {report.row_count.toLocaleString()} rows
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <StatusIcon status={report.status} />
                        <span
                          style={{
                            color: getStatusColor(report.status),
                            fontWeight: 500,
                          }}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                      {report.error_message && (
                        <p style={{ ...typography.caption, color: colors.critical, margin: 0, marginTop: 2 }}>
                          {report.error_message}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                      {report.generated_by.name}
                    </td>
                    <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                      {formatFileSize(report.file_size)}
                    </td>
                    <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                      {formatRelativeTime(report.created_at)}
                    </td>
                    <td style={{ padding: spacing.md, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'flex-end' }}>
                        {report.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report)}
                            disabled={downloadingId === report.id}
                            icon={<Download size={16} />}
                          >
                            {downloadingId === report.id ? 'Downloading...' : 'Download'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(report)}
                          icon={<Trash2 size={16} />}
                          style={{ color: colors.critical }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* New Report Modal */}
      {showNewReportModal && selectedReportType && (
        <Modal
          title={`Generate ${selectedReportType.name}`}
          onClose={() => {
            setShowNewReportModal(false);
            setSelectedReportType(null);
            setReportParams({});
          }}
        >
          <div style={{ padding: spacing.lg }}>
            <p style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.lg }}>
              {selectedReportType.description}
            </p>
            
            {/* Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {selectedReportType.parameters.map((param) => (
                <div key={param.key}>
                  <label
                    style={{
                      ...typography.caption,
                      color: colors.neutral[700],
                      display: 'block',
                      marginBottom: spacing.xs,
                      fontWeight: 500,
                    }}
                  >
                    {param.label}
                    {param.required && <span style={{ color: colors.critical }}> *</span>}
                  </label>
                  
                  {param.type === 'date' && (
                    <div style={{ position: 'relative' }}>
                      <Calendar
                        size={18}
                        style={{
                          position: 'absolute',
                          left: spacing.sm,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: colors.neutral[400],
                        }}
                      />
                      <input
                        type="date"
                        value={(reportParams[param.key] as string) || ''}
                        onChange={(e) => setReportParams(prev => ({ ...prev, [param.key]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: `${spacing.sm} ${spacing.md}`,
                          paddingLeft: '40px',
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.md,
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}
                  
                  {param.type === 'select' && param.options && (
                    <select
                      value={(reportParams[param.key] as string) || param.options[0]?.value || ''}
                      onChange={(e) => setReportParams(prev => ({ ...prev, [param.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        border: `1px solid ${colors.neutral[300]}`,
                        borderRadius: borderRadius.md,
                        fontSize: '14px',
                        backgroundColor: '#fff',
                      }}
                    >
                      {param.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  
                  {param.type === 'boolean' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(reportParams[param.key] as boolean) ?? param.defaultValue ?? false}
                        onChange={(e) => setReportParams(prev => ({ ...prev, [param.key]: e.target.checked }))}
                        style={{ width: 18, height: 18 }}
                      />
                      <span style={{ ...typography.body, color: colors.neutral[700] }}>
                        Yes
                      </span>
                    </label>
                  )}
                  
                  {param.type === 'text' && (
                    <input
                      type="text"
                      value={(reportParams[param.key] as string) || ''}
                      onChange={(e) => setReportParams(prev => ({ ...prev, [param.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        border: `1px solid ${colors.neutral[300]}`,
                        borderRadius: borderRadius.md,
                        fontSize: '14px',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl }}>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                fullWidth
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewReportModal(false);
                  setSelectedReportType(null);
                  setReportParams({});
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Delete Report?"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="critical"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default AuditReports;




