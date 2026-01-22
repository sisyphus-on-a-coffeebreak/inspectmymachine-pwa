/**
 * UserAccessReport Component
 * 
 * Displays a summary of what permissions a specific user has.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { LoadingError } from '@/components/ui/LoadingError';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Check, X, Shield, Clock, AlertTriangle } from 'lucide-react';

/**
 * User access summary from API
 */
interface UserAccessSummary {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  permissions: {
    module: string;
    actions: Array<{
      action: string;
      granted: boolean;
      source: 'role' | 'direct' | 'enhanced';
      expires_at?: string;
    }>;
  }[];
  enhanced_capabilities: Array<{
    module: string;
    action: string;
    expires_at?: string;
    granted_by: string;
  }>;
  last_login?: string;
  session_count: number;
}

interface UserAccessReportProps {
  userId: number;
  onClose?: () => void;
}

/**
 * Fetch user access summary
 */
async function getUserAccessSummary(userId: number): Promise<UserAccessSummary> {
  const response = await apiClient.get<UserAccessSummary>(`/v1/users/${userId}/access-summary`);
  return response.data;
}

export function UserAccessReport({ userId, onClose }: UserAccessReportProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-access-summary', userId],
    queryFn: () => getUserAccessSummary(userId),
  });
  
  if (isLoading) {
    return (
      <div style={{ padding: spacing.lg }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  
  if (error) {
    return (
      <LoadingError
        resource="user access summary"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }
  
  if (!data) return null;
  
  return (
    <div style={{ padding: spacing.lg }}>
      {/* User Info Header */}
      <div
        style={{
          ...cardStyles.base,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          backgroundColor: colors.primary + '05',
          borderColor: colors.primary + '30',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: borderRadius.full,
              backgroundColor: colors.primary + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            {data.user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ ...typography.header, color: colors.neutral[900], margin: 0 }}>
              {data.user.name}
            </h2>
            <p style={{ ...typography.body, color: colors.neutral[600], margin: 0 }}>
              {data.user.email}
            </p>
            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.sm }}>
              <span
                style={{
                  padding: `2px 10px`,
                  backgroundColor: colors.primary + '20',
                  color: colors.primary,
                  borderRadius: borderRadius.full,
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {data.user.role.replace('_', ' ')}
              </span>
              <span
                style={{
                  padding: `2px 10px`,
                  backgroundColor: data.user.is_active ? colors.success + '20' : colors.critical + '20',
                  color: data.user.is_active ? colors.success : colors.critical,
                  borderRadius: borderRadius.full,
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {data.user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
              Active Sessions
            </p>
            <p style={{ ...typography.header, color: colors.neutral[900], margin: 0 }}>
              {data.session_count}
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Capabilities */}
      {data.enhanced_capabilities.length > 0 && (
        <div style={{ ...cardStyles.base, padding: spacing.lg, marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.md }}>
            <Shield size={18} style={{ marginRight: spacing.sm, verticalAlign: 'middle', color: colors.warning }} />
            Enhanced Capabilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {data.enhanced_capabilities.map((cap, index) => (
              <div
                key={index}
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.warning + '10',
                  borderRadius: borderRadius.md,
                  borderLeft: `3px solid ${colors.warning}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ ...typography.body, fontWeight: 500, color: colors.neutral[900], margin: 0 }}>
                    {cap.module}.{cap.action}
                  </p>
                  <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
                    Granted by {cap.granted_by}
                  </p>
                </div>
                {cap.expires_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Clock size={14} color={colors.neutral[500]} />
                    <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Expires: {new Date(cap.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Permissions by Module */}
      <div style={{ ...cardStyles.base, padding: spacing.lg }}>
        <h3 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.lg }}>
          Permissions by Module
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {data.permissions.map((module) => (
            <div key={module.module}>
              <h4
                style={{
                  ...typography.body,
                  fontWeight: 600,
                  color: colors.neutral[700],
                  marginBottom: spacing.sm,
                  textTransform: 'capitalize',
                }}
              >
                {module.module.replace('_', ' ')}
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: spacing.sm,
                }}
              >
                {module.actions.map((action) => (
                  <div
                    key={action.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      padding: spacing.sm,
                      backgroundColor: action.granted ? colors.success + '10' : colors.neutral[100],
                      borderRadius: borderRadius.md,
                    }}
                  >
                    {action.granted ? (
                      <Check size={16} color={colors.success} />
                    ) : (
                      <X size={16} color={colors.neutral[400]} />
                    )}
                    <span
                      style={{
                        ...typography.caption,
                        color: action.granted ? colors.success : colors.neutral[500],
                        textTransform: 'capitalize',
                      }}
                    >
                      {action.action}
                    </span>
                    {action.source === 'enhanced' && (
                      <AlertTriangle size={12} color={colors.warning} title="Enhanced capability" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.neutral[50],
          borderRadius: borderRadius.md,
        }}
      >
        <h4 style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.sm }}>
          Legend
        </h4>
        <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <Check size={14} color={colors.success} />
            <span style={{ ...typography.caption, color: colors.neutral[600] }}>Granted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <X size={14} color={colors.neutral[400]} />
            <span style={{ ...typography.caption, color: colors.neutral[600] }}>Not Granted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <AlertTriangle size={14} color={colors.warning} />
            <span style={{ ...typography.caption, color: colors.neutral[600] }}>Enhanced (Temporary)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserAccessReport;





