/**
 * Enhanced Guard Register Component
 * 
 * Comprehensive activity log with all improvements:
 * - Chronological timeline view
 * - Activity type filters
 * - Search functionality
 * - Time range selection
 * - Enhanced statistics
 * - Export functionality
 * - Real-time updates
 * - Activity grouping
 * - Status indicators
 * - Filter by guard/gate
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/components/ui/Modal';
import { GuardDetailsModal, type GuardActionData } from './components/GuardDetailsModal';
import { ActivityLogTimeline, type ActivityLogEntry } from './components/ActivityLogTimeline';
import { ExportButton } from '@/components/ui/ExportButton';
import { accessService } from '@/lib/services/AccessService';
import { useGatePasses, useGuardLogs, accessPassKeys } from '@/hooks/useGatePasses';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/useAuth';
import { getCurrentLocation, getDefaultGateId } from '@/lib/utils/gateLocation';
import { useDebounce } from '@/hooks/useDebounce';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colors, spacing, responsiveSpacing, typography, borderRadius } from '@/lib/theme';
import { Search, Filter, Download, RefreshCw, Calendar, Users, MapPin, BarChart3 } from 'lucide-react';
import type { GatePass } from './gatePassTypes';
import { isVisitorPass, isVehiclePass, canEnter, canExit, getPassTypeLabel } from './gatePassTypes';

type ActivityTab = 'expected' | 'inside' | 'log';
type ActivityTypeFilter = 'all' | 'entry' | 'exit' | 'return' | 'pending';
type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export const GuardRegister: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [selectedRecord, setSelectedRecord] = useState<GatePass | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityTab>(
    (searchParams.get('tab') as ActivityTab) || 'expected'
  );
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityTypeFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [guardFilter, setGuardFilter] = useState<string>('all');
  const [gateFilter, setGateFilter] = useState<string>('all');
  const [showGrouped, setShowGrouped] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Calculate date range based on timeRange
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Debug: Log date calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('[GuardRegister] Date calculation:', {
        timeRange,
        todayDate: today.toISOString(),
        todayFormatted: today.toISOString().split('T')[0],
        currentTime: new Date().toISOString(),
      });
    }
    
    switch (timeRange) {
      case 'today':
        return {
          date_from: today.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0],
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          date_from: yesterday.toISOString().split('T')[0],
          date_to: yesterday.toISOString().split('T')[0],
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return {
          date_from: weekStart.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0],
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          date_from: monthStart.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0],
        };
      default:
        return {
          date_from: today.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0],
        };
    }
  }, [timeRange]);

  // Fetch passes based on active tab and filters
  // For "inside" and "log" tabs, don't filter by status - fetch all and filter client-side
  // For "inside" and "log" tabs, always include today in the date range to catch newly entered passes
  const today = new Date().toISOString().split('T')[0];
  const filters = {
    date_from: (activeTab === 'inside' || activeTab === 'log')
      ? dateRange.date_from // Start from selected date range
      : dateRange.date_from,
    date_to: (activeTab === 'inside' || activeTab === 'log')
      ? today // Always include today for "inside" and "log" tabs to catch newly entered passes
      : dateRange.date_to,
    status: activeTab === 'expected' ? 'pending' : undefined, // Don't filter by status for 'inside' and 'log' tabs
    per_page: 200,
  };
  
  // Debug: Log filters being sent
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GuardRegister] API Filters:', filters);
      console.log('[GuardRegister] Date Range:', dateRange);
    }
  }, [filters, dateRange]);
  
  const { 
    data: passesData, 
    isLoading: loading, 
    error: passesError,
    isError: isPassesError,
    refetch 
  } = useGatePasses(filters, {
    // Enable refetch on window focus to catch new entries
    refetchOnWindowFocus: true,
    // Refetch every 10 seconds to catch new entries automatically
    refetchInterval: 10000,
    // Debug: Log API response
    onSuccess: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[GuardRegister] API Response:', {
          total: data?.total,
          dataLength: data?.data?.length,
          firstPass: data?.data?.[0],
          fullResponse: data,
        });
      }
    },
  });

  // Fetch guard logs for activity timeline
  const { 
    data: guardLogsData, 
    error: logsError,
    isError: isLogsError,
    refetch: refetchLogs 
  } = useGuardLogs({
    date: dateRange.date_from,
    per_page: 200,
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      refetchLogs();
      setLastRefreshTime(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refetch, refetchLogs]);

  // Show error toasts when data fetching fails
  useEffect(() => {
    if (isPassesError && passesError) {
      console.error('Failed to fetch gate passes:', passesError);
      showToast({
        title: 'Failed to Load Passes',
        description: passesError instanceof Error ? passesError.message : 'Unable to fetch gate passes. Please try again.',
        variant: 'error',
      });
    }
  }, [isPassesError, passesError, showToast]);

  useEffect(() => {
    if (isLogsError && logsError) {
      console.error('Failed to fetch guard logs:', logsError);
      // Don't show toast for logs error as it's less critical
      // Just log it for debugging
    }
  }, [isLogsError, logsError]);

  // Get GPS location on mount
  useEffect(() => {
    getCurrentLocation().then(setCurrentLocation);
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
    setSearchParams(params, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Transform gate passes into activity log entries
  const activityLogEntries = useMemo((): ActivityLogEntry[] => {
    const allPasses = passesData?.data || [];
    // For "inside" tab, filter to show passes with entry_time (entered but not exited)
    const passesToProcess = activeTab === 'inside' 
      ? allPasses.filter((p: GatePass) => 
          p.status === 'inside' || (p.entry_time && !p.exit_time)
        )
      : allPasses;
    const entries: ActivityLogEntry[] = [];

    passesToProcess.forEach((pass: GatePass) => {
      // Validate pass has valid ID
      if (!pass || !pass.id) {
        console.warn('Gate pass missing ID:', pass);
        return;
      }
      
      // Entry activity
      if (pass.entry_time) {
        entries.push({
          id: `entry-${pass.id}`,
          pass_id: String(pass.id), // Ensure it's a string
          pass,
          activity_type: 'entry',
          timestamp: pass.entry_time,
          guard_name: pass.entry_guard?.name || user?.name,
          guard_id: pass.entry_guard?.id || user?.id,
          gate_name: pass.entry_gate?.name || 'Gate 1',
          gate_id: pass.entry_gate?.id,
          location: pass.entry_location,
          notes: pass.entry_notes,
          status: pass.status === 'inside' ? 'active' : 
                  pass.status === 'completed' ? 'completed' : 
                  pass.status === 'pending' ? 'pending' : 'completed',
        });
      }

      // Exit activity
      if (pass.exit_time) {
        const entryTime = pass.entry_time ? new Date(pass.entry_time) : null;
        const exitTime = new Date(pass.exit_time);
        const duration = entryTime 
          ? `${Math.floor((exitTime.getTime() - entryTime.getTime()) / 60000)}m`
          : undefined;

        entries.push({
          id: `exit-${pass.id}`,
          pass_id: String(pass.id), // Ensure it's a string
          pass,
          activity_type: 'exit',
          timestamp: pass.exit_time,
          guard_name: pass.exit_guard?.name || user?.name,
          guard_id: pass.exit_guard?.id || user?.id,
          gate_name: pass.exit_gate?.name || 'Gate 1',
          gate_id: pass.exit_gate?.id,
          location: pass.exit_location,
          notes: pass.exit_notes,
          duration,
          status: 'completed',
        });
      }

      // Pending activity (if no entry yet)
      if (pass.status === 'pending' && !pass.entry_time) {
        entries.push({
          id: `pending-${pass.id}`,
          pass_id: String(pass.id), // Ensure it's a string
          pass,
          activity_type: 'pending',
          timestamp: pass.valid_from || pass.created_at,
          status: new Date(pass.valid_from || pass.created_at) < new Date() ? 'overdue' : 'pending',
        });
      }
    });

    // Debug: Log final entries for log tab
    if (process.env.NODE_ENV === 'development' && activeTab === 'log') {
      console.log('[GuardRegister] Activity log entries generated:', {
        totalEntries: entries.length,
        entryCount: entries.filter(e => e.activity_type === 'entry').length,
        exitCount: entries.filter(e => e.activity_type === 'exit').length,
        pendingCount: entries.filter(e => e.activity_type === 'pending').length,
        sampleEntry: entries[0],
        allPassesCount: allPasses.length,
        passesToProcessCount: passesToProcess.length,
      });
    }

    return entries;
  }, [passesData, user, activeTab]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activityLogEntries;

    // Activity type filter
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(a => a.activity_type === activityTypeFilter);
    }

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(a => {
        const pass = a.pass;
        if (!pass) return false;
        
        return (
          pass.pass_number?.toLowerCase().includes(query) ||
          (isVisitorPass(pass) && pass.visitor_name?.toLowerCase().includes(query)) ||
          (isVehiclePass(pass) && pass.vehicle?.registration_number?.toLowerCase().includes(query)) ||
          a.guard_name?.toLowerCase().includes(query) ||
          a.gate_name?.toLowerCase().includes(query)
        );
      });
    }

    // Guard filter
    if (guardFilter !== 'all') {
      filtered = filtered.filter(a => 
        a.guard_id?.toString() === guardFilter || a.guard_name === guardFilter
      );
    }

    // Gate filter
    if (gateFilter !== 'all') {
      filtered = filtered.filter(a => 
        a.gate_id === gateFilter || a.gate_name === gateFilter
      );
    }

    return filtered;
  }, [activityLogEntries, activityTypeFilter, debouncedSearch, guardFilter, gateFilter]);

  // Group activities by pass (entry + exit together)
  const groupedActivities = useMemo(() => {
    if (!showGrouped) return filteredActivities;

    const grouped = new Map<string, ActivityLogEntry[]>();
    
    filteredActivities.forEach(activity => {
      const key = activity.pass_id;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(activity);
    });

    // Sort each group by timestamp
    grouped.forEach((activities, key) => {
      activities.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    // Flatten and sort by most recent activity
    return Array.from(grouped.values())
      .flat()
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [filteredActivities, showGrouped]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Use passesForDisplay for accurate stats
    const passesForStats = activeTab === 'inside' 
      ? (passesData?.data || []).filter((p: GatePass) => 
          p.status === 'inside' || (p.entry_time && !p.exit_time)
        )
      : passesData?.data || [];
    const activities = activityLogEntries;
    
    const entries = activities.filter(a => a.activity_type === 'entry').length;
    const exits = activities.filter(a => a.activity_type === 'exit').length;
    const pending = activities.filter(a => a.activity_type === 'pending').length;
    const active = activities.filter(a => a.status === 'active').length;
    
    // Busiest hour
    const hourCounts = new Map<number, number>();
    activities.forEach(a => {
      const hour = new Date(a.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const busiestHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // Unique guards
    const guards = new Set(activities.map(a => a.guard_id).filter(Boolean));
    
    // Unique gates
    const gates = new Set(activities.map(a => a.gate_id).filter(Boolean));

    return {
      total_activities: activities.length,
      entries,
      exits,
      pending,
      active,
      busiest_hour: busiestHour,
      active_guards: guards.size,
      gates_used: gates.size,
      visitors_inside: passesForStats.filter((p: GatePass) => 
        isVisitorPass(p) && (p.status === 'inside' || (p.entry_time && !p.exit_time))
      ).length,
      vehicles_inside: passesForStats.filter((p: GatePass) => 
        isVehiclePass(p) && (p.status === 'inside' || (p.entry_time && !p.exit_time))
      ).length,
    };
  }, [passesData, activityLogEntries, activeTab]);

  // Get unique guards and gates for filters
  const { uniqueGuards, uniqueGates } = useMemo(() => {
    const guards = new Set<string>();
    const gates = new Set<string>();
    
    activityLogEntries.forEach(a => {
      if (a.guard_name) guards.add(a.guard_name);
      if (a.gate_name) gates.add(a.gate_name);
    });

    return {
      uniqueGuards: Array.from(guards),
      uniqueGates: Array.from(gates),
    };
  }, [activityLogEntries]);

  // Define allPasses before early returns (needed for hooks and useMemos)
  const allPasses = passesData?.data || [];

  // Debug logging (must be before any early returns to comply with Rules of Hooks)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GuardRegister] Data update:', {
        activeTab,
        totalPasses: allPasses.length,
        passesWithEntryTime: allPasses.filter((p: GatePass) => p.entry_time).length,
        passesWithStatusInside: allPasses.filter((p: GatePass) => p.status === 'inside').length,
        dateRange,
        passesDataTotal: passesData?.total,
        passesDataKeys: passesData ? Object.keys(passesData) : null,
        isLoading: loading,
        hasError: isPassesError,
        error: passesError,
        rawPassesData: passesData,
      });
    }
  }, [allPasses, activeTab, dateRange, passesData, loading, isPassesError, passesError]);

  // For "inside" tab, also include passes that have entry_time set (even if status isn't 'inside')
  // This ensures we show all entered visitors/vehicles
  // MUST be before early returns to comply with Rules of Hooks
  const passesForDisplay = useMemo(() => {
    if (activeTab === 'inside') {
      // Include passes with status='inside' OR passes with entry_time set (entered but not yet exited)
      const filtered = allPasses.filter((p: GatePass) => 
        p.status === 'inside' || (p.entry_time && !p.exit_time)
      );
      if (process.env.NODE_ENV === 'development') {
        console.log('[GuardRegister] Inside tab filtering:', {
          totalPasses: allPasses.length,
          filteredPasses: filtered.length,
          passesWithEntryTime: allPasses.filter((p: GatePass) => p.entry_time).length,
        });
      }
      return filtered;
    }
    return allPasses;
  }, [allPasses, activeTab]);

  const visitorPasses = useMemo(() => 
    passesForDisplay.filter((p: GatePass) => isVisitorPass(p)), 
    [passesForDisplay]
  );
  
  const vehicleMovements = useMemo(() => 
    passesForDisplay.filter((p: GatePass) => !isVisitorPass(p)), 
    [passesForDisplay]
  );

  // Prepare export data (MUST be before early returns to comply with Rules of Hooks)
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const exportData = useMemo(() => {
    return filteredActivities.map(a => ({
      'Time': formatTime(a.timestamp),
      'Activity Type': a.activity_type.toUpperCase(),
      'Pass Number': a.pass?.pass_number || '',
      'Visitor/Vehicle': isVisitorPass(a.pass!) 
        ? a.pass?.visitor_name 
        : a.pass?.vehicle?.registration_number || '',
      'Guard': a.guard_name || '',
      'Gate': a.gate_name || '',
      'Status': a.status,
      'Notes': a.notes || '',
      'Duration': a.duration || '',
    }));
  }, [filteredActivities]);

  // Handlers
  const handleMarkEntry = async (passId: string) => {
    try {
      const record = await accessService.get(passId);
      setSelectedRecord(record);
    } catch (error) {
      // Log error for debugging
      console.error('Failed to load pass details:', error);
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load pass details. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleConfirmEntry = async (data: GuardActionData) => {
    if (!selectedRecord) return;
    
    if (!canEnter(selectedRecord)) {
      showToast({
        title: 'Validation Error',
        description: selectedRecord.status !== 'active' 
          ? 'Pass is not active. Cannot record entry.'
          : 'Pass has expired. Cannot record entry.',
        variant: 'error',
      });
      return;
    }
    
    try {
      const conditionSnapshot = {
        asset_checklist: data.asset_checklist,
        incident_log: data.incident_log,
        escort_required: data.escort_required,
        escort_name: data.escort_name,
        supervisor_escalated: data.supervisor_escalated,
        escalation_reason: data.escalation_reason,
      };

      const result = await accessService.recordEntry(selectedRecord.id, {
        notes: data.notes,
        guard_id: user?.id,
        gate_id: getDefaultGateId() || undefined,
        location: currentLocation || undefined,
        condition_snapshot: conditionSnapshot,
      });
      
      showToast({
        title: 'Success',
        description: 'Entry marked successfully!',
        variant: 'success',
      });
      
      setSelectedRecord(null);
      
      // Invalidate React Query cache to force fresh data
      queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accessPassKeys.guardLogs() });
      
      // Force refetch with a delay to ensure backend has processed
      setTimeout(async () => {
        console.log('[GuardRegister] Refetching after entry recorded...');
        try {
          await Promise.all([refetch(), refetchLogs()]);
          console.log('[GuardRegister] Refetch completed successfully');
          setLastRefreshTime(new Date());
        } catch (error) {
          console.error('[GuardRegister] Refetch failed:', error);
        }
      }, 1000); // Increased delay to ensure backend processing
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to mark entry';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      throw error;
    }
  };

  const handleMarkExit = async (passId: string) => {
    const allPasses = passesData?.data || [];
    const pass = allPasses.find((p: GatePass) => p.id === passId);
    
    if (!pass || !canExit(pass)) {
      showToast({
        title: 'Validation Error',
        description: 'Pass is not in a state that allows exit.',
        variant: 'error',
      });
      return;
    }

    const confirmed = await confirm({
      title: 'Mark Exit',
      message: `Mark this pass as exited?`,
      confirmLabel: 'Mark Exit',
      cancelLabel: 'Cancel',
    });
    
    if (!confirmed) return;

    try {
      await accessService.recordExit(passId, {
        guard_id: user?.id,
        gate_id: getDefaultGateId() || undefined,
        location: currentLocation || undefined,
      });
      
      showToast({
        title: 'Success',
        description: 'Exit marked successfully!',
        variant: 'success',
      });
      
      refetch();
      refetchLogs();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to mark exit';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchLogs()]);
    setLastRefreshTime(new Date());
    showToast({
      title: 'Refreshed',
      description: 'Activity log updated',
      variant: 'success',
      duration: 2000,
    });
  };

  const handleExport = () => {
    // Export will be handled by ExportButton component
  };

  // Show error state if data fetching failed
  if (isPassesError && (!passesData?.data || passesData.data.length === 0)) {
    return (
      <div style={{ 
        padding: spacing.xxl, 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>⚠️</div>
        <h2 style={{ 
          ...typography.header,
          fontSize: 'clamp(22px, 5.5vw, 24px)', // Responsive: 22px mobile, 24px desktop
          color: colors.error?.[700] || '#DC2626',
          marginBottom: spacing.md
        }}>
          Failed to Load Guard Register
        </h2>
        <p style={{ 
          ...typography.body,
          color: colors.neutral[600],
          marginBottom: spacing.xl
        }}>
          {passesError instanceof Error ? passesError.message : 'Unable to fetch gate pass data. Please check your connection and try again.'}
        </p>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
          <Button
            variant="primary"
            onClick={() => {
              refetch();
              refetchLogs();
            }}
          >
            🔄 Retry
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/stockyard/access')}
          >
            ← Back to Gate Pass
          </Button>
        </div>
      </div>
    );
  }

  if (loading && (!passesData?.data || passesData.data.length === 0)) {
    return (
      <div style={{ padding: spacing.xxl, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>⏳</div>
        <div style={{ color: colors.neutral[600] }}>Loading register...</div>
      </div>
    );
  }

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      {ConfirmComponent}
      {selectedRecord && (
        <GuardDetailsModal
          record={selectedRecord}
          onConfirm={handleConfirmEntry}
          onCancel={() => setSelectedRecord(null)}
          onClose={() => setSelectedRecord(null)}
          showSlaTimer={true}
          slaSeconds={300}
        />
      )}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: spacing.md,
        paddingBottom: '5rem',
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: spacing.lg,
          paddingBottom: spacing.md,
          borderBottom: `1px solid ${colors.neutral[200]}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
            <div>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                margin: 0,
                marginBottom: spacing.xs,
              }}>
                🛡️ Security Register
              </h1>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
              <div style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                Last refresh: {lastRefreshTime.toLocaleTimeString()}
              </div>
              <button
                onClick={handleRefresh}
                style={{
                  padding: spacing.xs,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: spacing.md,
            marginTop: spacing.md,
          }}>
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.success[50],
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.success[200]}`,
            }}>
              <div style={{ ...typography.bodySmall, color: colors.success[700], marginBottom: spacing.xs }}>
                ⏰ Inside Now
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.success[700] }}>
                {stats.visitors_inside + stats.vehicles_inside}
              </div>
            </div>
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.warning[50],
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.warning[200]}`,
            }}>
              <div style={{ ...typography.bodySmall, color: colors.warning[700], marginBottom: spacing.xs }}>
                📥 Expected
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.warning[700] }}>
                {stats.pending}
              </div>
            </div>
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.primary[50],
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.primary[200]}`,
            }}>
              <div style={{ ...typography.bodySmall, color: colors.primary[700], marginBottom: spacing.xs }}>
                📊 Total Today
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.primary[700] }}>
                {stats.total_activities}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: spacing.xs,
          marginBottom: spacing.lg,
          backgroundColor: colors.neutral[100],
          padding: spacing.xs,
          borderRadius: borderRadius.lg,
        }}>
          {(['expected', 'inside', 'log'] as ActivityTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: spacing.sm,
                border: 'none',
                borderRadius: borderRadius.md,
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? colors.neutral[900] : colors.neutral[600],
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'expected' && '📥 Expected'}
              {tab === 'inside' && '👁️ Inside'}
              {tab === 'log' && '📋 Log'}
            </button>
          ))}
        </div>

        {/* Filters and Search - Show for Log tab */}
        {activeTab === 'log' && (
          <div style={{
            marginBottom: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}>
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  left: spacing.sm,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.neutral[400],
                }}
              />
              <Input
                type="text"
                placeholder="Search by pass number, visitor, vehicle, guard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: spacing.xxl,
                }}
              />
            </div>

            {/* Activity Type Filters */}
            <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
              {(['all', 'entry', 'exit', 'return', 'pending'] as ActivityTypeFilter[]).map(type => (
                <button
                  key={type}
                  onClick={() => setActivityTypeFilter(type)}
                  style={{
                    padding: `${spacing.xs}px ${spacing.sm}px`,
                    border: `1px solid ${activityTypeFilter === type ? colors.primary[500] : colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: activityTypeFilter === type ? colors.primary[500] : 'white',
                    color: activityTypeFilter === type ? 'white' : colors.neutral[700],
                    fontWeight: activityTypeFilter === type ? 600 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== 'all' && ` (${stats[type === 'entry' ? 'entries' : type === 'exit' ? 'exits' : 'pending']})`}
                </button>
              ))}
            </div>

            {/* Time Range and Additional Filters */}
            <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {uniqueGuards.length > 0 && (
                <select
                  value={guardFilter}
                  onChange={(e) => setGuardFilter(e.target.value)}
                  style={{
                    padding: `${spacing.xs}px ${spacing.sm}px`,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="all">All Guards</option>
                  {uniqueGuards.map(guard => (
                    <option key={guard} value={guard}>{guard}</option>
                  ))}
                </select>
              )}

              {uniqueGates.length > 0 && (
                <select
                  value={gateFilter}
                  onChange={(e) => setGateFilter(e.target.value)}
                  style={{
                    padding: `${spacing.xs}px ${spacing.sm}px`,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="all">All Gates</option>
                  {uniqueGates.map(gate => (
                    <option key={gate} value={gate}>{gate}</option>
                  ))}
                </select>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showGrouped}
                  onChange={(e) => setShowGrouped(e.target.checked)}
                />
                <span style={{ ...typography.bodySmall }}>Group by Pass</span>
              </label>

              <ExportButton
                data={exportData}
                formats={['csv', 'excel']}
                options={{
                  filename: `guard-register-${dateRange.date_from}.csv`,
                }}
                module="gate_pass"
                size="sm"
                variant="secondary"
              />
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'expected' && (
          <div>
            <h2 style={{ ...typography.heading, marginBottom: spacing.md }}>
              📥 Expected Arrivals
            </h2>
            {visitorPasses.filter((p: GatePass) => p.status === 'pending').length === 0 ? (
              <div style={{
                padding: spacing.xxl,
                textAlign: 'center',
                border: `2px dashed ${colors.neutral[300]}`,
                borderRadius: borderRadius.lg,
                color: colors.neutral[600],
              }}>
                <div style={{ fontSize: '3rem', marginBottom: spacing.sm }}>✅</div>
                <div>No expected arrivals</div>
              </div>
            ) : (
              visitorPasses
                .filter((p: GatePass) => p.status === 'pending')
                .map((pass: GatePass) => (
                  <div
                    key={pass.id}
                    style={{
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[200]}`,
                      borderRadius: borderRadius.lg,
                      backgroundColor: 'white',
                      marginBottom: spacing.md,
                    }}
                  >
                    <div style={{ marginBottom: spacing.sm }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600 }}>Pass #{pass.pass_number}</div>
                        {pass.valid_from && <div style={{ ...typography.bodySmall }}>🕐 {formatTime(pass.valid_from)}</div>}
                      </div>
                    </div>
                    <div style={{ marginBottom: spacing.sm }}>
                      <strong>👤 {pass.visitor_name}</strong>
                    </div>
                    <Button
                      onClick={() => handleMarkEntry(pass.id)}
                      variant="primary"
                      style={{ width: '100%' }}
                    >
                      ✓ Mark Entry
                    </Button>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'inside' && (
          <div>
            <h2 style={{ ...typography.heading, marginBottom: spacing.md }}>
              👁️ Inside Now
            </h2>
            {visitorPasses.filter((p: GatePass) => p.status === 'inside').length === 0 && 
             vehicleMovements.filter((p: GatePass) => p.status === 'inside').length === 0 ? (
              <div style={{
                padding: spacing.xxl,
                textAlign: 'center',
                border: `2px dashed ${colors.neutral[300]}`,
                borderRadius: borderRadius.lg,
                color: colors.neutral[600],
              }}>
                <div style={{ fontSize: '3rem', marginBottom: spacing.sm }}>🏛️</div>
                <div>Yard is empty</div>
              </div>
            ) : (
              <>
                {visitorPasses
                  .filter((p: GatePass) => p.status === 'inside')
                  .map((pass: GatePass) => (
                    <div
                      key={pass.id}
                      style={{
                        padding: spacing.md,
                        border: `2px solid ${colors.success[500]}`,
                        borderRadius: borderRadius.lg,
                        backgroundColor: colors.success[50],
                        marginBottom: spacing.md,
                      }}
                    >
                      <div style={{ marginBottom: spacing.sm }}>
                        <div style={{ fontWeight: 600 }}>🟢 Pass #{pass.pass_number}</div>
                      </div>
                      <div style={{ marginBottom: spacing.sm }}>
                        <strong>👤 {pass.visitor_name}</strong>
                        {pass.entry_time && (
                          <div style={{ ...typography.bodySmall }}>
                            ⏰ Entry: {formatTime(pass.entry_time)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: spacing.sm }}>
                        <Button
                          onClick={() => navigate(`/app/stockyard/access/${pass.id}`)}
                          variant="secondary"
                          style={{ flex: 1 }}
                        >
                          👁️ Details
                        </Button>
                        <Button
                          onClick={() => handleMarkExit(pass.id)}
                          variant="primary"
                          style={{ flex: 1 }}
                        >
                          ✓ Mark Exit
                        </Button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <h2 style={{ ...typography.heading }}>
                📋 Today's Activity Log
              </h2>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                {filteredActivities.length} activities
              </div>
            </div>

            {/* Enhanced Statistics */}
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
              marginBottom: spacing.lg,
              border: `1px solid ${colors.neutral[200]}`,
            }}>
              <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.sm }}>
                📊 Today's Summary
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: spacing.sm,
                ...typography.bodySmall,
              }}>
                <div>Total Activities: <strong>{stats.total_activities}</strong></div>
                <div>Entries: <strong>{stats.entries}</strong></div>
                <div>Exits: <strong>{stats.exits}</strong></div>
                <div>Pending: <strong>{stats.pending}</strong></div>
                <div>Active: <strong>{stats.active}</strong></div>
                <div>Busiest Hour: <strong>{stats.busiest_hour}:00</strong></div>
                <div>Active Guards: <strong>{stats.active_guards}</strong></div>
                <div>Gates Used: <strong>{stats.gates_used}</strong></div>
              </div>
            </div>

            <ActivityLogTimeline
              activities={groupedActivities}
              onViewDetails={(passId) => {
                if (!passId || passId === 'undefined' || passId === 'null') {
                  showToast({
                    title: 'Invalid Pass ID',
                    description: 'The gate pass ID is missing or invalid.',
                    variant: 'error',
                  });
                  return;
                }
                navigate(`/app/stockyard/access/${passId}`);
              }}
              onMarkExit={handleMarkExit}
              showActions={true}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginTop: spacing.xl }}>
          <h2 style={{ ...typography.heading, marginBottom: spacing.md }}>
            🚶 Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <Button
              onClick={() => navigate('/app/stockyard/access/create?type=visitor')}
              variant="secondary"
              style={{ width: '100%', textAlign: 'left' }}
            >
              + Log Walk-in Visitor
            </Button>
            <Button
              onClick={() => navigate('/app/stockyard/access/create?type=inbound')}
              variant="secondary"
              style={{ width: '100%', textAlign: 'left' }}
            >
              + Log Quick Vehicle Entry
            </Button>
          </div>
        </div>
      </div>
    </PullToRefreshWrapper>
  );
};

