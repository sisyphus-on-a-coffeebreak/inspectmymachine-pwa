/**
 * Needs Attention Widget
 * 
 * Shows items that require immediate attention
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedApprovals } from '../../../hooks/useUnifiedApprovals';
import { useAlerts } from '../../../lib/queries';
import { colors, spacing, typography } from '../../../lib/theme';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export function NeedsAttentionWidget() {
  const navigate = useNavigate();
  const { counts: approvalCounts } = useUnifiedApprovals({});
  const { data: alertsData } = useAlerts({ severity: 'critical', acknowledged: false });

  const criticalAlerts = alertsData?.data || [];
  const totalAttention = approvalCounts.all + criticalAlerts.length;

  if (totalAttention === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: spacing.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <AlertTriangle size={24} color={colors.warning[500]} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}
          >
            Needs Attention
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {approvalCounts.all > 0 && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.warning[50],
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onClick={() => navigate('/app/approvals')}
          >
            <span style={{ color: colors.neutral[700] }}>
              {approvalCounts.all} pending approval{approvalCounts.all !== 1 ? 's' : ''}
            </span>
            <ArrowRight size={16} color={colors.neutral[600]} />
          </div>
        )}

        {criticalAlerts.length > 0 && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.error[50],
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onClick={() => navigate('/app/alerts?severity=critical')}
          >
            <span style={{ color: colors.neutral[700] }}>
              {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''}
            </span>
            <ArrowRight size={16} color={colors.neutral[600]} />
          </div>
        )}
      </div>
    </div>
  );
}






