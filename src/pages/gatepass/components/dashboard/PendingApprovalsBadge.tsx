/**
 * PendingApprovalsBadge Component
 * 
 * Shows pending approval count with quick action
 * Used in Supervisor dashboard
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../../../../lib/apiClient';
import { colors, spacing, typography, borderRadius, cardStyles } from '../../../../lib/theme';
import { Button } from '../../../../components/ui/button';

interface PendingApprovalsBadgeProps {
  compact?: boolean;
}

export const PendingApprovalsBadge: React.FC<PendingApprovalsBadgeProps> = ({ 
  compact = false 
}) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await apiClient.get('/gate-pass-approval/pending', {
          params: { status: 'pending' }
        });
        setPendingCount(Array.isArray(response.data) ? response.data.length : 0);
      } catch (error) {
        console.error('Failed to fetch pending approvals:', error);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ ...cardStyles.base, padding: spacing.md }}>
        <div style={{ color: colors.neutral[500] }}>Loading...</div>
      </div>
    );
  }

  if (pendingCount === null || pendingCount === 0) {
    if (compact) {
      return null;
    }
    return (
      <div style={{ 
        ...cardStyles.base, 
        padding: spacing.lg,
        backgroundColor: colors.success[50],
        border: `2px solid ${colors.success[200]}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <CheckCircle size={24} color={colors.success[600]} />
          <div>
            <div style={{ ...typography.subheader, color: colors.success[800] }}>
              All Approvals Complete
            </div>
            <div style={{ ...typography.bodySmall, color: colors.success[700] }}>
              No pending approval requests
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        variant="warning"
        onClick={() => navigate('/app/gate-pass/approval')}
        icon={<AlertCircle size={18} />}
        style={{
          position: 'relative',
        }}
      >
        Approvals
        {pendingCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: colors.error[500],
            color: 'white',
            borderRadius: borderRadius.full,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div 
      style={{ 
        ...cardStyles.base, 
        padding: spacing.lg,
        backgroundColor: colors.warning[50],
        border: `2px solid ${colors.warning[300]}`,
        cursor: 'pointer',
      }}
      onClick={() => navigate('/app/gate-pass/approval')}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardStyles.base.boxShadow as string;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <AlertCircle size={32} color={colors.warning[600]} />
          <div>
            <div style={{ ...typography.header, color: colors.warning[800] }}>
              {pendingCount} Pending Approval{pendingCount !== 1 ? 's' : ''}
            </div>
            <div style={{ ...typography.bodySmall, color: colors.warning[700] }}>
              Requires your attention
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/app/gate-pass/approval');
          }}
        >
          Review →
        </Button>
      </div>
    </div>
  );
};






