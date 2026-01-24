import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUnifiedApprovals, useBulkApproval, type ApprovalType, type UnifiedApproval } from '../../hooks/useUnifiedApprovals';
import { useAuth } from '../../providers/useAuth';
import { useToast } from '../../providers/ToastProvider';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { colors, spacing, typography } from '../../lib/theme';
import { formatDistanceToNow } from 'date-fns';
import { ApprovalCard } from './components/ApprovalCard';
import { ApprovalDetailModal } from './components/ApprovalDetailModal';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { CardGrid } from '../../components/ui/ResponsiveGrid';
import { hasCapability } from '../../lib/users';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const UnifiedApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { bulkApprove, bulkReject } = useBulkApproval();
  const isMobile = useIsMobile();

  // Get initial tab from URL or default to 'all'
  const initialTab = (searchParams.get('tab') as ApprovalType | 'all') || 'all';
  const [activeTab, setActiveTab] = useState<ApprovalType | 'all'>(initialTab);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedApproval, setSelectedApproval] = useState<UnifiedApproval | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState<'oldest' | 'newest'>('oldest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch approvals
  const { approvals, counts, isLoading, refetch } = useUnifiedApprovals({
    type: activeTab === 'all' ? undefined : activeTab,
    sortBy,
    search: searchQuery || undefined,
  });

  // Keyboard shortcuts for bulk operations
  useKeyboardShortcuts([
    {
      key: 'a',
      ctrl: true,
      action: () => {
        if (approvals.length > 0) {
          handleSelectAll();
        }
      },
      description: 'Select all pending approvals',
    },
  ], approvals.length > 0);

  // Filter visible tabs based on user capabilities
  const visibleTabs = useMemo(() => {
    const tabs: Array<{ id: ApprovalType | 'all'; label: string; count: number }> = [
      { id: 'all', label: 'All', count: counts.all },
    ];

    // Gate Pass approvals - check capability
    if (hasCapability(user, 'gate_pass', 'approve')) {
      tabs.push({ id: 'gate_pass', label: 'Gate Pass', count: counts.gate_pass });
    }

    // Expense approvals - check capability
    if (hasCapability(user, 'expense', 'approve')) {
      tabs.push({ id: 'expense', label: 'Expenses', count: counts.expense });
    }

    // Transfer approvals - check capability (transfers are part of stockyard)
    if (hasCapability(user, 'stockyard', 'approve')) {
      tabs.push({ id: 'transfer', label: 'Transfers', count: counts.transfer });
    }

    return tabs;
  }, [user, counts]);

  const handleTabChange = (tab: ApprovalType | 'all') => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'all') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === approvals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(approvals.map((a) => a.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      showToast({
        title: 'No Selection',
        description: 'Please select items to approve',
        variant: 'error',
      });
      return;
    }

    try {
      await bulkApprove(Array.from(selectedIds));
      showToast({
        title: 'Success',
        description: `${selectedIds.size} item(s) approved successfully`,
        variant: 'success',
      });
      setSelectedIds(new Set());
      refetch();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to approve items',
        variant: 'error',
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      showToast({
        title: 'No Selection',
        description: 'Please select items to reject',
        variant: 'error',
      });
      return;
    }

    if (!rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    try {
      await bulkReject(Array.from(selectedIds), rejectionReason);
      showToast({
        title: 'Success',
        description: `${selectedIds.size} item(s) rejected successfully`,
        variant: 'success',
      });
      setSelectedIds(new Set());
      setRejectionReason('');
      setShowRejectModal(false);
      refetch();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to reject items',
        variant: 'error',
      });
    }
  };

  const handleView = (approval: UnifiedApproval) => {
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  const handleApprove = async (approval: UnifiedApproval) => {
    // This will be handled by the detail modal
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  const handleReject = async (approval: UnifiedApproval) => {
    // This will be handled by the detail modal
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  if (isLoading && approvals.length === 0) {
    return (
      <div style={{ padding: spacing.xl }}>
        <SkeletonLoader variant="page" />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? spacing.md : spacing.xl,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: colors.neutral[50],
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <PageHeader
        title="Approvals"
        subtitle="Review and approve pending requests"
        icon="✅"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Approvals' },
        ]}
      />

      {/* Tabs */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.md,
          marginBottom: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <SegmentedControl
          options={visibleTabs.map((tab) => ({
            value: tab.id,
            label: `${tab.label} (${tab.count})`,
          }))}
          value={activeTab}
          onChange={(value) => handleTabChange(value as ApprovalType | 'all')}
          fullWidth={isMobile}
        />
      </div>

      {/* Bulk Actions Bar - Prominent when items are selected */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'sticky',
            top: isMobile ? '60px' : '80px',
            zIndex: 100,
            backgroundColor: colors.primary,
            color: 'white',
            padding: spacing.md,
            borderRadius: '12px',
            marginBottom: spacing.lg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              {selectedIds.size}
            </div>
            <span style={{ ...typography.body, fontWeight: 600, color: 'white' }}>
              {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={() => setSelectedIds(new Set())}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Clear
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(true)}
              style={{
                backgroundColor: colors.error[500],
                color: 'white',
                border: 'none',
              }}
            >
              Reject ({selectedIds.size})
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkApprove}
              style={{
                backgroundColor: colors.success[500],
                color: 'white',
                border: 'none',
                fontWeight: 600,
              }}
            >
              ✓ Approve ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.lg,
          marginBottom: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          gap: spacing.md,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Input
            type="text"
            placeholder="Search approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'oldest' | 'newest')}
          style={{
            padding: spacing.sm,
            borderRadius: '8px',
            border: `1px solid ${colors.neutral[300]}`,
            fontSize: '14px',
          }}
        >
          <option value="oldest">Oldest First</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {approvals.length > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: spacing.md,
            marginBottom: spacing.lg,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            flexWrap: 'wrap',
            gap: spacing.md,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <input
              type="checkbox"
              checked={selectedIds.size === approvals.length && approvals.length > 0}
              onChange={handleSelectAll}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ ...typography.body, color: colors.neutral[700] }}>
              Select All ({selectedIds.size} selected)
            </span>
          </div>
          {selectedIds.size > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: spacing.sm,
              width: isMobile ? '100%' : 'auto',
            }}>
              <Button variant="primary" onClick={handleBulkApprove} style={{ width: isMobile ? '100%' : 'auto' }}>
                Approve Selected ({selectedIds.size})
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(true)}
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                Reject Selected ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Pending Approvals"
          description={
            activeTab === 'all'
              ? 'All approvals have been processed'
              : `No pending ${activeTab} approvals`
          }
        />
      ) : (
        <CardGrid gap="md">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              isSelected={selectedIds.has(approval.id)}
              onSelect={(selected) => handleSelect(approval.id, selected)}
              onApprove={() => handleApprove(approval)}
              onReject={() => handleReject(approval)}
              onView={() => handleView(approval)}
            />
          ))}
        </CardGrid>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: spacing.xl,
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ ...typography.header, marginBottom: spacing.lg }}>
              Reject {selectedIds.size} Item(s)
            </h3>
            <p style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.lg }}>
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: spacing.lg,
              }}
            />
            <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleBulkReject}
                disabled={!rejectionReason.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApproval(null);
          }}
          onApprove={() => {
            setShowDetailModal(false);
            refetch();
          }}
          onReject={() => {
            setShowDetailModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};






