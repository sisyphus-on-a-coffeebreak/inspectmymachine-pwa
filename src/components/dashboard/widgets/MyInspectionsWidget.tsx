/**
 * My Inspections Widget
 * 
 * Shows inspector's recent and pending inspections
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspections } from '../../../lib/queries';
import { useAuth } from '../../../providers/useAuth';
import { colors, spacing, typography } from '../../../lib/theme';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function MyInspectionsWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch user's inspections
  const { data: inspectionsData, isLoading } = useInspections({
    inspector_id: user?.id,
    per_page: 5,
  });

  const inspections = inspectionsData?.data || [];

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
        <div style={{ color: colors.neutral[400] }}>Loading inspections...</div>
      </div>
    );
  }

  if (inspections.length === 0) {
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
          <ClipboardList size={24} color={colors.primary} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}
          >
            My Inspections
          </h3>
        </div>
        <button
          onClick={() => navigate('/app/inspections?filter=mine')}
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
        {inspections.map((inspection: any) => (
          <div
            key={inspection.id}
            style={{
              padding: spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/app/inspections/${inspection.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: colors.neutral[900] }}>
                  {inspection.vehicle?.registration_number || inspection.template?.name || 'Inspection'}
                </div>
                <div style={{ fontSize: '12px', color: colors.neutral[600], marginTop: spacing.xs }}>
                  {inspection.status || 'pending'}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: colors.neutral[500] }}>
                {formatDistanceToNow(new Date(inspection.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}











