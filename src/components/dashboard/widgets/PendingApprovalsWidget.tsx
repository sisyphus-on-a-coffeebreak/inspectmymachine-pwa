import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedApprovals } from '../../../hooks/useUnifiedApprovals';
import { StatCard } from '../../ui/StatCard';
import { colors, spacing } from '../../../lib/theme';
import { CheckCircle } from 'lucide-react';

export function PendingApprovalsWidget() {
  const navigate = useNavigate();
  const { counts, isLoading } = useUnifiedApprovals({});

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ color: colors.neutral[400] }}>Loading approvals...</div>
      </div>
    );
  }

  if (counts.all === 0) {
    return null; // Don't show widget if no pending approvals
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: spacing.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => navigate('/app/approvals')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/app/approvals');
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="View pending approvals"
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
          <CheckCircle size={24} color={colors.warning[500]} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}
          >
            Pending Approvals
          </h3>
        </div>
        <div
          style={{
            backgroundColor: colors.warning[500],
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {counts.all}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {counts.gate_pass > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.neutral[600] }}>🎫 Gate Passes</span>
            <span style={{ fontWeight: 600, color: colors.neutral[900] }}>{counts.gate_pass}</span>
          </div>
        )}
        {counts.expense > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.neutral[600] }}>💰 Expenses</span>
            <span style={{ fontWeight: 600, color: colors.neutral[900] }}>{counts.expense}</span>
          </div>
        )}
        {counts.transfer > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.neutral[600] }}>📦 Transfers</span>
            <span style={{ fontWeight: 600, color: colors.neutral[900] }}>{counts.transfer}</span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTop: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <button
          style={{
            width: '100%',
            padding: spacing.sm,
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/app/approvals');
          }}
        >
          Review All →
        </button>
      </div>
    </div>
  );
}











