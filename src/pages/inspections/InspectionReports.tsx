/**
 * Inspection Reports Page
 * 
 * Lists all inspection reports with filtering, search, and export capabilities.
 * Each report can be viewed, shared, and exported as PDF.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { NetworkError } from '../../components/ui/NetworkError';
import { InspectionReport } from '../../components/inspection/InspectionReport';
import { useInspections } from '../../lib/queries';
import { FileText, Search, Filter, Download, Share2, Eye, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { logger } from '../../lib/logger';

export const InspectionReports: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const { data: inspectionsData, isLoading, isError, error, refetch } = useInspections({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    per_page: perPage,
    page: currentPage,
  });

  const inspections = inspectionsData?.data || [];
  const total = inspectionsData?.total || 0;

  // Filter by search query
  const filteredInspections = useMemo(() => {
    if (!searchQuery.trim()) return inspections;
    
    const query = searchQuery.toLowerCase();
    return inspections.filter((insp: any) => {
      return (
        insp.vehicle?.registration_number?.toLowerCase().includes(query) ||
        insp.vehicle?.make?.toLowerCase().includes(query) ||
        insp.vehicle?.model?.toLowerCase().includes(query) ||
        insp.inspector?.name?.toLowerCase().includes(query) ||
        insp.template?.name?.toLowerCase().includes(query) ||
        insp.id?.toLowerCase().includes(query)
      );
    });
  }, [inspections, searchQuery]);

  const handleViewReport = (inspectionId: string) => {
    setSelectedInspection(inspectionId);
  };

  const handleGeneratePDF = async () => {
    // TODO: Implement PDF generation
    logger.info('Generate PDF for inspection', { selectedInspection }, 'InspectionReports');
  };

  const handleEmailReport = async () => {
    // TODO: Implement email report
    logger.info('Email report for inspection', { selectedInspection }, 'InspectionReports');
  };

  const handleShareReport = async () => {
    // TODO: Implement share report
    if (selectedInspection) {
      const url = `${window.location.origin}/app/inspections/${selectedInspection}`;
      if (navigator.share) {
        await navigator.share({ title: 'Inspection Report', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Report link copied to clipboard');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return colors.success[600];
      case 'rejected':
        return colors.error[600];
      case 'pending':
        return colors.warning[600];
      default:
        return colors.neutral[600];
    }
  };

  const getPassFailColor = (passFail?: string) => {
    switch (passFail) {
      case 'pass':
        return colors.success[600];
      case 'fail':
        return colors.error[600];
      case 'conditional':
        return colors.warning[600];
      default:
        return colors.neutral[600];
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Inspection Reports"
          subtitle="View and manage inspection reports"
          icon={<FileText size={24} />}
        />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Inspection Reports"
          subtitle="View and manage inspection reports"
          icon={<FileText size={24} />}
        />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  const selectedInspectionData = selectedInspection
    ? filteredInspections.find((i: any) => i.id === selectedInspection)
    : null;

  if (selectedInspectionData) {
    return (
      <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: spacing.lg }}>
          <Button variant="secondary" onClick={() => setSelectedInspection(null)}>
            ← Back to Reports
          </Button>
        </div>
        <InspectionReport
          inspection={selectedInspectionData}
          onGeneratePDF={handleGeneratePDF}
          onEmailReport={handleEmailReport}
          onShareReport={handleShareReport}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title="Inspection Reports"
        subtitle="View and manage inspection reports"
        icon={<FileText size={24} />}
      />

      {/* Search and Filters */}
      <div
        style={{
          ...cardStyles.card,
          marginBottom: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.neutral[400],
            }}
          />
          <input
            type="text"
            placeholder="Search by vehicle, inspector, or template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing.md} ${spacing.md} ${spacing.md} ${spacing.xxl}`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              ...typography.body,
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={16} color={colors.neutral[600]} />
          <Button
            variant={statusFilter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </Button>
        </div>
      </div>

      {/* Reports List */}
      {filteredInspections.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No reports found"
          description={
            searchQuery
              ? `No inspections match "${searchQuery}". Try a different search term.`
              : 'No inspection reports available yet.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {filteredInspections.map((inspection: any) => (
            <div
              key={inspection.id}
              style={{
                ...cardStyles.card,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => handleViewReport(inspection.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
                    <h3 style={{ ...typography.header, fontSize: '18px' }}>
                      {inspection.vehicle?.registration_number || 'Unknown Vehicle'}
                    </h3>
                    <span
                      style={{
                        ...typography.caption,
                        color: getStatusColor(inspection.status),
                        backgroundColor: getStatusColor(inspection.status) + '15',
                        padding: `${spacing.xs} ${spacing.sm}`,
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      {inspection.status}
                    </span>
                    {inspection.pass_fail && (
                      <span
                        style={{
                          ...typography.caption,
                          color: getPassFailColor(inspection.pass_fail),
                          backgroundColor: getPassFailColor(inspection.pass_fail) + '15',
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.sm,
                        }}
                      >
                        {inspection.pass_fail === 'pass' ? (
                          <CheckCircle2 size={14} style={{ display: 'inline', marginRight: spacing.xs }} />
                        ) : inspection.pass_fail === 'fail' ? (
                          <XCircle size={14} style={{ display: 'inline', marginRight: spacing.xs }} />
                        ) : (
                          <AlertCircle size={14} style={{ display: 'inline', marginRight: spacing.xs }} />
                        )}
                        {inspection.pass_fail}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <FileText size={16} color={colors.neutral[500]} />
                      <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {inspection.template?.name || 'Unknown Template'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <Calendar size={16} color={colors.neutral[500]} />
                      <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {inspection.completed_at
                          ? new Date(inspection.completed_at).toLocaleDateString('en-IN')
                          : 'Not completed'}
                      </span>
                    </div>
                    {inspection.inspector && (
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        Inspector: {inspection.inspector.name}
                      </div>
                    )}
                    {inspection.overall_rating && (
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        Rating: {inspection.overall_rating}/10
                      </div>
                    )}
                  </div>

                  {inspection.has_critical_issues && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.error[50],
                        borderRadius: borderRadius.sm,
                        marginTop: spacing.xs,
                      }}
                    >
                      <AlertCircle size={16} color={colors.error[600]} />
                      <span style={{ ...typography.bodySmall, color: colors.error[700] }}>
                        Critical issues found
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewReport(inspection.id);
                    }}
                  >
                    <Eye size={16} style={{ marginRight: spacing.xs }} />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > perPage && (
        <div style={{ marginTop: spacing.xl, display: 'flex', justifyContent: 'center', gap: spacing.sm }}>
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span style={{ ...typography.body, color: colors.neutral[600], alignSelf: 'center' }}>
            Page {currentPage} of {Math.ceil(total / perPage)}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage >= Math.ceil(total / perPage)}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

