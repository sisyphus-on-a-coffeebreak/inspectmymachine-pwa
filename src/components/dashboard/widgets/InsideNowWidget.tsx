/**
 * Inside Now Widget
 * 
 * Shows vehicles/visitors currently inside for guards
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatePasses } from '../../../lib/queries';
import { colors, spacing, typography } from '../../../lib/theme';
import { Users, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function InsideNowWidget() {
  const navigate = useNavigate();

  // Fetch active passes (inside but not exited)
  const { data: passesData, isLoading } = useGatePasses({
    status: 'approved',
    per_page: 20,
  });

  const passes = passesData?.data || [];
  const insideNow = passes.filter((pass: any) => {
    // Check if pass is currently inside (has scan_in but no scan_out)
    return (pass.scan_in_at || pass.entry_at) && !(pass.scan_out_at || pass.exit_at);
  });

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
        <div style={{ color: colors.neutral[400] }}>Loading...</div>
      </div>
    );
  }

  if (insideNow.length === 0) {
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
          <Users size={24} color={colors.success[500]} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}
          >
            Currently Inside
          </h3>
        </div>
        <button
          onClick={() => navigate('/app/gate-pass?filter=inside')}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.primary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: '14px',
          }}
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {insideNow.slice(0, 5).map((pass: any) => (
          <div
            key={pass.id}
            style={{
              padding: spacing.md,
              backgroundColor: colors.success[50],
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/app/gate-pass/${pass.id}`)}
          >
            <div style={{ fontWeight: 600, color: colors.neutral[900] }}>
              {pass.visitor_name || pass.vehicle_registration || pass.pass_number}
            </div>
            <div style={{ fontSize: '12px', color: colors.neutral[600], marginTop: spacing.xs }}>
              {pass.purpose || 'Visit'}
            </div>
            {(pass.scan_in_at || pass.entry_at) && (
              <div style={{ fontSize: '11px', color: colors.neutral[500], marginTop: spacing.xs }}>
                Entered {formatDistanceToNow(new Date(pass.scan_in_at || pass.entry_at), { addSuffix: true })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}










