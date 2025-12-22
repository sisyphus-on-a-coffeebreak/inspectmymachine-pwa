/**
 * Buyer Readiness & Merchandising Pipeline
 * 
 * Kanban board for tracking vehicles through resale readiness stages
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { CardGrid } from '../../components/ui/ResponsiveGrid';
import { useBuyerReadinessRecords, useUpdateBuyerReadinessStage } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { ShoppingBag, Camera, Sparkles, FileText, CheckCircle2, Car, Image, DollarSign, ExternalLink } from 'lucide-react';
import type { BuyerReadinessStage } from '../../lib/stockyard';
import { useQueryClient } from '@tanstack/react-query';

const stageConfig: Record<BuyerReadinessStage, { label: string; color: string; bgColor: string; icon: React.ElementType; description: string }> = {
  awaiting_inspection: {
    label: 'Awaiting Inspection',
    color: colors.warning[600],
    bgColor: colors.warning[50],
    icon: FileText,
    description: 'Vehicle needs inspection',
  },
  ready_to_photograph: {
    label: 'Ready to Photograph',
    color: colors.primary,
    bgColor: colors.primary + '15',
    icon: Camera,
    description: 'Ready for photo shoot',
  },
  awaiting_detailing: {
    label: 'Awaiting Detailing',
    color: colors.warning[600],
    bgColor: colors.warning[50],
    icon: Sparkles,
    description: 'Needs detailing work',
  },
  ready_for_listing: {
    label: 'Ready for Listing',
    color: colors.success[600],
    bgColor: colors.success[50],
    icon: CheckCircle2,
    description: 'Ready to list for sale',
  },
  listed: {
    label: 'Listed',
    color: colors.success[700],
    bgColor: colors.success[100],
    icon: ShoppingBag,
    description: 'Currently listed',
  },
};

const stages: BuyerReadinessStage[] = [
  'awaiting_inspection',
  'ready_to_photograph',
  'awaiting_detailing',
  'ready_for_listing',
  'listed',
];

export const BuyerReadinessBoard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<BuyerReadinessStage | 'all'>('all');

  const { data: recordsData, isLoading, isError, error, refetch } = useBuyerReadinessRecords(
    selectedStage !== 'all' ? { stage: selectedStage } : undefined
  );

  const records = recordsData?.data || [];

  const recordsByStage = React.useMemo(() => {
    const grouped: Record<BuyerReadinessStage, typeof records> = {
      awaiting_inspection: [],
      ready_to_photograph: [],
      awaiting_detailing: [],
      ready_for_listing: [],
      listed: [],
    };

    records.forEach((record) => {
      grouped[record.stage].push(record);
    });

    return grouped;
  }, [records]);

  const updateStageMutation = useUpdateBuyerReadinessStage({
    onSuccess: () => {
      showToast({
        title: 'Updated',
        description: 'Stage updated successfully',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to update stage',
        variant: 'error',
      });
    },
  });

  const handleStageChange = async (recordId: string, newStage: BuyerReadinessStage) => {
    updateStageMutation.mutate({ recordId, stage: newStage });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Buyer Readiness Board"
          subtitle="Track vehicles through resale readiness stages"
          icon={<ShoppingBag size={24} />}
        />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Buyer Readiness Board"
          subtitle="Track vehicles through resale readiness stages"
          icon={<ShoppingBag size={24} />}
        />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Buyer Readiness Board"
        subtitle="Track vehicles through resale readiness stages"
        icon={<ShoppingBag size={24} />}
      />

      {/* Stage Filter */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Button
            variant={selectedStage === 'all' ? 'primary' : 'secondary'}
            onClick={() => setSelectedStage('all')}
            style={{ fontSize: '14px' }}
          >
            All Stages ({records.length})
          </Button>
          {stages.map((stage) => {
            const config = stageConfig[stage];
            const count = recordsByStage[stage].length;
            return (
              <Button
                key={stage}
                variant={selectedStage === stage ? 'primary' : 'secondary'}
                onClick={() => setSelectedStage(stage)}
                style={{ fontSize: '14px' }}
              >
                {config.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      {selectedStage === 'all' ? (
        <CardGrid style={{ paddingBottom: spacing.md }}>
        {(selectedStage === 'all' ? stages : [selectedStage]).map((stage) => {
          const config = stageConfig[stage];
          const Icon = config.icon;
          const stageRecords = recordsByStage[stage];

          return (
            <div
              key={stage}
              style={{
                ...cardStyles.card,
                backgroundColor: config.bgColor,
                border: `2px solid ${config.color}`,
                minWidth: '280px',
              }}
            >
              {/* Column Header */}
              <div style={{ marginBottom: spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                  <Icon size={20} color={config.color} />
                  <span style={{ ...typography.header, fontSize: '18px', color: config.color }}>
                    {config.label}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: config.color,
                      color: 'white',
                      borderRadius: borderRadius.sm,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {stageRecords.length}
                  </span>
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  {config.description}
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {stageRecords.length === 0 ? (
                  <div
                    style={{
                      padding: spacing.xl,
                      textAlign: 'center',
                      color: colors.neutral[500],
                      ...typography.bodySmall,
                    }}
                  >
                    No vehicles in this stage
                  </div>
                ) : (
                  stageRecords.map((record) => (
                    <div
                      key={record.id}
                      style={{
                        ...cardStyles.card,
                        backgroundColor: 'white',
                        border: `1px solid ${colors.neutral[200]}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => navigate(`/app/stockyard/${record.stockyard_request_id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Vehicle Info */}
                      <div style={{ marginBottom: spacing.sm }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                          <Car size={16} color={colors.primary} />
                          <span style={{ ...typography.body, fontWeight: 600 }}>
                            {record.vehicle?.registration_number || 'Unknown'}
                          </span>
                        </div>
                        {record.vehicle?.make && (
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {record.vehicle.make} {record.vehicle.model}
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.sm }}>
                        {record.photo_set_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <Image size={14} color={colors.success[600]} />
                            <span style={{ ...typography.caption, color: colors.neutral[600] }}>Photos ready</span>
                          </div>
                        )}
                        {record.inspection_summary_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <FileText size={14} color={colors.primary} />
                            <span style={{ ...typography.caption, color: colors.neutral[600] }}>Inspection done</span>
                          </div>
                        )}
                        {record.pricing_guidance && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <DollarSign size={14} color={colors.success[600]} />
                            <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                              {formatCurrency(record.pricing_guidance)}
                            </span>
                          </div>
                        )}
                        {record.listing_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <ExternalLink size={14} color={colors.primary} />
                            <a
                              href={record.listing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...typography.caption, color: colors.primary, textDecoration: 'none' }}
                            >
                              View Listing
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Stage Actions */}
                      <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                        {stages.indexOf(stage) > 0 && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const prevStage = stages[stages.indexOf(stage) - 1];
                              handleStageChange(record.id, prevStage);
                            }}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            ← Previous
                          </Button>
                        )}
                        {stages.indexOf(stage) < stages.length - 1 && (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStage = stages[stages.indexOf(stage) + 1];
                              handleStageChange(record.id, nextStage);
                            }}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Next →
                          </Button>
                        )}
                      </div>

                      {record.notes && (
                        <div
                          style={{
                            marginTop: spacing.sm,
                            padding: spacing.sm,
                            backgroundColor: colors.neutral[50],
                            borderRadius: borderRadius.sm,
                            ...typography.caption,
                            color: colors.neutral[700],
                          }}
                        >
                          {record.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {records.length === 0 && (
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="No Buyer Readiness Records"
          description="Vehicles will appear here as they progress through readiness stages"
        />
      )}
    </div>
  );
};

