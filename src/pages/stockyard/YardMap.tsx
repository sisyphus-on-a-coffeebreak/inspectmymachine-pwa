/**
 * Yard Map & Slot Management
 * 
 * Interactive yard map showing slot occupancy, status, and allowing drag-and-drop reassignment
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useYardMap, useStockyardRequests } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { getSlotUtilization, isSlotAvailable } from '../../lib/stockyard-utils';
import { Map, Car, Package, AlertCircle, CheckCircle2, Clock, XCircle, ArrowRight, Filter, Building2 } from 'lucide-react';
import type { YardSlot, YardSlotStatus } from '../../lib/stockyard';
import { apiClient } from '../../lib/apiClient';
import { logger } from '../../lib/logger';

interface Yard {
  id: string;
  name: string;
  city?: string;
  state?: string;
  is_active?: boolean;
}

const statusConfig: Record<YardSlotStatus, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
  available: {
    color: colors.success[600],
    bgColor: colors.success[50],
    label: 'Available',
    icon: CheckCircle2,
  },
  occupied: {
    color: colors.primary,
    bgColor: colors.primary + '15',
    label: 'Occupied',
    icon: Car,
  },
  reserved: {
    color: colors.warning[600],
    bgColor: colors.warning[50],
    label: 'Reserved',
    icon: Clock,
  },
  maintenance: {
    color: colors.error[600],
    bgColor: colors.error[50],
    label: 'Maintenance',
    icon: AlertCircle,
  },
  blocked: {
    color: colors.neutral[600],
    bgColor: colors.neutral[100],
    label: 'Blocked',
    icon: XCircle,
  },
};

export const YardMap: React.FC = () => {
  const { yardId: routeYardId } = useParams<{ yardId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [yards, setYards] = useState<Yard[]>([]);
  const [yardsLoading, setYardsLoading] = useState(true);
  const [selectedYardId, setSelectedYardId] = useState<string>(routeYardId || '');
  const [statusFilter, setStatusFilter] = useState<YardSlotStatus | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [draggedSlot, setDraggedSlot] = useState<YardSlot | null>(null);
  const [targetSlot, setTargetSlot] = useState<string | null>(null);

  // Fetch yards on mount
  useEffect(() => {
    const fetchYards = async () => {
      try {
        setYardsLoading(true);
        const response = await apiClient.get('/v1/yards');
        const yardsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        const activeYards = yardsData.filter((yard: Yard) => yard.is_active !== false);
        setYards(activeYards);
        
        // If no yard is selected but we have yards, select the first one
        if (!routeYardId && activeYards.length > 0) {
          const firstActiveYard = activeYards[0];
          setSelectedYardId(firstActiveYard.id);
          navigate(`/app/stockyard/yards/${firstActiveYard.id}/map`, { replace: true });
        }
      } catch (err) {
        logger.error('Failed to fetch yards', err, 'YardMap');
      } finally {
        setYardsLoading(false);
      }
    };
    fetchYards();
  }, [routeYardId, navigate]);

  // Update selected yard when route param changes
  useEffect(() => {
    if (routeYardId && routeYardId !== selectedYardId) {
      setSelectedYardId(routeYardId);
    }
  }, [routeYardId]);

  // Handle yard selection
  const handleYardChange = (newYardId: string) => {
    if (newYardId) {
      setSelectedYardId(newYardId);
      navigate(`/app/stockyard/yards/${newYardId}/map`, { replace: true });
    }
  };

  // Only fetch if yardId is valid (not empty and not the route placeholder)
  const isValidYardId = selectedYardId && selectedYardId !== '' && selectedYardId !== ':yardId';
  const { data: yardMap, isLoading, isError, error, refetch } = useYardMap(isValidYardId ? selectedYardId : '', {
    enabled: isValidYardId,
  });
  const { data: requestsData } = useStockyardRequests({ status: 'Approved' });

  const filteredSlots = useMemo(() => {
    if (!yardMap?.slots) return [];
    let filtered = yardMap.slots;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((slot) => slot.status === statusFilter);
    }

    if (zoneFilter !== 'all') {
      filtered = filtered.filter((slot) => slot.zone === zoneFilter);
    }

    return filtered;
  }, [yardMap?.slots, statusFilter, zoneFilter]);

  const zones = useMemo(() => {
    if (!yardMap?.zones) return [];
    return yardMap.zones;
  }, [yardMap?.zones]);

  const handleSlotClick = (slot: YardSlot) => {
    if (slot.vehicle_id && slot.stockyard_request_id) {
      navigate(`/app/stockyard/${slot.stockyard_request_id}`);
    }
  };

  const handleDragStart = (slot: YardSlot) => {
    if (slot.status === 'occupied' && slot.vehicle_id) {
      setDraggedSlot(slot);
    }
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    if (draggedSlot && draggedSlot.id !== slotId) {
      setTargetSlot(slotId);
    }
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
    setTargetSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    if (!draggedSlot || !draggedSlot.vehicle_id) return;

    const targetSlot = filteredSlots.find((s) => s.id === targetSlotId);
    if (!targetSlot || targetSlot.status !== 'available') {
      showToast({
        title: 'Invalid Target',
        description: 'Target slot must be available',
        variant: 'error',
      });
      return;
    }

    try {
      const { reassignVehicleSlot } = await import('../../lib/stockyard');
      await reassignVehicleSlot(draggedSlot.id, targetSlotId, draggedSlot.vehicle_id);
      showToast({
        title: 'Success',
        description: 'Vehicle reassigned successfully',
        variant: 'success',
      });
      refetch();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to reassign vehicle',
        variant: 'error',
      });
    } finally {
      setDraggedSlot(null);
      setTargetSlot(null);
    }
  };

  if (yardsLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Yard Map" subtitle="Manage yard slots and occupancy" icon={<Map size={24} />} />
        <SkeletonLoader count={3} />
      </div>
    );
  }

  if (yards.length === 0) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Yard Map" subtitle="Manage yard slots and occupancy" icon={<Map size={24} />} />
        <EmptyState
          icon={<Building2 size={48} />}
          title="No Yards Available"
          description="No active yards found. Please create a yard first."
        />
      </div>
    );
  }

  if (!isValidYardId) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Yard Map" subtitle="Manage yard slots and occupancy" icon={<Map size={24} />} />
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          marginTop: spacing.lg,
          boxShadow: cardStyles.boxShadow,
        }}>
          <label style={{ ...typography.label, marginBottom: spacing.sm, display: 'block' }}>
            Select Yard
          </label>
          <select
            value={selectedYardId}
            onChange={(e) => handleYardChange(e.target.value)}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="">Select a yard...</option>
            {yards.map((yard) => (
              <option key={yard.id} value={yard.id}>
                {yard.name} {yard.city ? `(${yard.city}${yard.state ? `, ${yard.state}` : ''})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Yard Map" subtitle="Manage yard slots and occupancy" icon={<Map size={24} />} />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Yard Map" subtitle="Manage yard slots and occupancy" icon={<Map size={24} />} />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!yardMap) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Yard Map" subtitle="Manage yard slots and occupancy" icon={<Map size={24} />} />
        <EmptyState
          icon={<Map size={48} />}
          title="Yard Map Not Found"
          description="The requested yard map could not be loaded"
        />
      </div>
    );
  }

  const stats = {
    total: yardMap.slots.length,
    occupied: yardMap.slots.filter((s) => s.status === 'occupied').length,
    available: yardMap.slots.filter((s) => s.status === 'available').length,
    reserved: yardMap.slots.filter((s) => s.status === 'reserved').length,
  };

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title={`${yardMap.yard_name} - Yard Map`}
        subtitle="Manage yard slots and occupancy"
        icon={<Map size={24} />}
      />

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <div style={{ ...cardStyles.card, textAlign: 'center' }}>
          <div style={{ ...typography.header, fontSize: '2rem', marginBottom: spacing.xs }}>
            {stats.total}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Total Slots</div>
        </div>
        <div style={{ ...cardStyles.card, textAlign: 'center' }}>
          <div style={{ ...typography.header, fontSize: '2rem', color: colors.primary, marginBottom: spacing.xs }}>
            {stats.occupied}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Occupied</div>
        </div>
        <div style={{ ...cardStyles.card, textAlign: 'center' }}>
          <div style={{ ...typography.header, fontSize: '2rem', color: colors.success[600], marginBottom: spacing.xs }}>
            {stats.available}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Available</div>
        </div>
        <div style={{ ...cardStyles.card, textAlign: 'center' }}>
          <div style={{ ...typography.header, fontSize: '2rem', color: colors.warning[600], marginBottom: spacing.xs }}>
            {stats.reserved}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Reserved</div>
        </div>
      </div>

      {/* Yard Selector and Filters */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Yard Selector */}
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Yard
            </label>
            <select
              value={selectedYardId}
              onChange={(e) => handleYardChange(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              {yards.map((yard) => (
                <option key={yard.id} value={yard.id}>
                  {yard.name} {yard.city ? `(${yard.city}${yard.state ? `, ${yard.state}` : ''})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as YardSlotStatus | 'all')}
              style={{
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                minWidth: '150px',
              }}
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Filter */}
          {zones.length > 0 && (
            <div>
              <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
                Zone
              </label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                style={{
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  minWidth: '150px',
                }}
              >
                <option value="all">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Yard Map Grid */}
      <div style={{ ...cardStyles.card }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: spacing.md,
          }}
        >
          {filteredSlots.map((slot) => {
            const config = statusConfig[slot.status];
            const Icon = config.icon;
            const isDragging = draggedSlot?.id === slot.id;
            const isTarget = targetSlot === slot.id;

            return (
              <div
                key={slot.id}
                draggable={slot.status === 'occupied' && !!slot.vehicle_id}
                onDragStart={() => handleDragStart(slot)}
                onDragOver={(e) => handleDragOver(e, slot.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, slot.id)}
                onClick={() => handleSlotClick(slot)}
                style={{
                  ...cardStyles.card,
                  border: `2px solid ${isTarget ? colors.primary : config.color}`,
                  backgroundColor: isTarget ? colors.primary + '10' : config.bgColor,
                  cursor: slot.status === 'occupied' ? 'grab' : 'pointer',
                  opacity: isDragging ? 0.5 : 1,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                      Slot {slot.slot_number}
                    </div>
                    {slot.zone && (
                      <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                        Zone: {slot.zone}
                      </div>
                    )}
                  </div>
                  <Icon size={20} color={config.color} />
                </div>

                <div style={{ marginTop: spacing.sm }}>
                  <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Status: <strong style={{ color: config.color }}>{config.label}</strong>
                  </div>
                  <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                    Capacity: {slot.current_occupancy}/{slot.capacity} ({getSlotUtilization(slot)}%)
                  </div>
                  {!isSlotAvailable(slot) && slot.status === 'available' && slot.reserved_until && (
                    <div style={{ ...typography.caption, color: colors.warning[600], marginTop: spacing.xs }}>
                      Reserved until {new Date(slot.reserved_until).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {slot.vehicle && (
                  <div
                    style={{
                      marginTop: spacing.sm,
                      padding: spacing.sm,
                      backgroundColor: 'white',
                      borderRadius: borderRadius.sm,
                      border: `1px solid ${colors.neutral[200]}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <Car size={14} color={colors.primary} />
                      <span style={{ ...typography.bodySmall, fontWeight: 600 }}>
                        {slot.vehicle.registration_number}
                      </span>
                    </div>
                    {slot.vehicle.make && (
                      <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                        {slot.vehicle.make} {slot.vehicle.model}
                      </div>
                    )}
                  </div>
                )}

                {slot.status === 'occupied' && slot.vehicle_id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: spacing.xs,
                      right: spacing.xs,
                      padding: '2px 6px',
                      backgroundColor: colors.primary,
                      color: 'white',
                      borderRadius: borderRadius.sm,
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    Drag to move
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredSlots.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing.xxl }}>
            <EmptyState
              icon={<Map size={48} />}
              title="No Slots Found"
              description="No slots match the current filters"
            />
          </div>
        )}
      </div>
    </div>
  );
};

