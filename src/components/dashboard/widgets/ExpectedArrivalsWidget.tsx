/**
 * Expected Arrivals Widget
 * 
 * Shows gate passes expected today for guards
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatePasses } from '../../../lib/queries';
import { colors, spacing, typography } from '../../../lib/theme';
import { Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function ExpectedArrivalsWidget() {
  const navigate = useNavigate();

  // Fetch expected passes for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: passesData, isLoading } = useGatePasses({
    status: 'approved',
    per_page: 20,
  });

  const passes = passesData?.data || [];
  const expectedPasses = passes.filter((pass: any) => {
    if (!pass.valid_from) return false;
    const validFrom = new Date(pass.valid_from);
    return validFrom >= today && validFrom < tomorrow;
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
        <div style={{ color: colors.neutral[400] }}>Loading expected arrivals...</div>
      </div>
    );
  }

  if (expectedPasses.length === 0) {
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
          <Clock size={24} color={colors.primary} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}
          >
            Expected Today
          </h3>
        </div>
        <button
          onClick={() => navigate('/app/gate-pass?filter=expected')}
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
        {expectedPasses.slice(0, 5).map((pass: any) => (
          <div
            key={pass.id}
            style={{
              padding: spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/app/gate-pass/${pass.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: colors.neutral[900] }}>
                  {pass.visitor_name || pass.vehicle_registration || pass.pass_number}
                </div>
                <div style={{ fontSize: '12px', color: colors.neutral[600], marginTop: spacing.xs }}>
                  {pass.purpose || 'Visit'}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: colors.neutral[500] }}>
                {formatDistanceToNow(new Date(pass.valid_from), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


