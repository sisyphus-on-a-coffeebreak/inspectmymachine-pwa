/**
 * GatePassEmptyState Component
 * 
 * Empty state component specifically for gate passes
 * Handles both "no data" and "no results" scenarios
 */

import React from 'react';
import { Search, FileText, X } from 'lucide-react';
import { colors, typography, spacing, borderRadius } from '../../../lib/theme';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/EmptyState';

export interface GatePassEmptyStateProps {
  type: 'no-data' | 'no-results';
  onClearFilters?: () => void;
  onCreatePass?: () => void;
  hasActiveFilters?: boolean;
}

export const GatePassEmptyState: React.FC<GatePassEmptyStateProps> = ({
  type,
  onClearFilters,
  onCreatePass,
  hasActiveFilters = false,
}) => {
  if (type === 'no-data') {
    return (
      <EmptyState
        icon="🚪"
        title="No gate passes yet"
        description="Create your first gate pass to get started. You can create visitor passes, vehicle outbound passes, or vehicle inbound passes."
        action={
          onCreatePass
            ? {
                label: 'Create Gate Pass',
                onClick: onCreatePass,
                variant: 'primary',
              }
            : undefined
        }
      />
    );
  }

  // No results (filtered)
  return (
    <div
      style={{
        padding: spacing.xl,
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
        margin: spacing.lg,
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: spacing.lg }}>
        <Search size={64} color={colors.neutral[400]} />
      </div>
      
      <h3 style={{ 
        ...typography.header,
        fontSize: '24px',
        color: colors.neutral[800],
        marginBottom: spacing.sm
      }}>
        No passes match your filters
      </h3>
      
      <p style={{ 
        ...typography.body, 
        color: colors.neutral[600],
        maxWidth: '400px',
        margin: '0 auto',
        marginBottom: spacing.xl
      }}>
        Try adjusting your search or filters to see more results.
      </p>
      
      {hasActiveFilters && onClearFilters && (
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={onClearFilters}
            icon={<X size={16} />}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};






