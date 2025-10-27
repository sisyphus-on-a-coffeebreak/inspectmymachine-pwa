import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatsGrid, ActionGrid } from '../../components/ui/ResponsiveGrid';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';

interface DashboardStats {
  total_today: number;
  total_week: number;
  total_month: number;
  pending: number;
  completed: number;
  approved: number;
  rejected: number;
  pass_rate: number;
  avg_duration: number;
  critical_issues: number;
}

interface RecentInspection {
  id: string;
  vehicle_registration: string;
  vehicle_make: string;
  vehicle_model: string;
  inspector_name: string;
  status: string;
  overall_rating: number;
  pass_fail: string;
  created_at: string;
  has_critical_issues: boolean;
}

export const InspectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<RecentInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from backend, fallback to mock data if not available
      try {
        const [statsRes, recentRes] = await Promise.all([
          axios.get('/api/v1/inspection-dashboard'),
          axios.get('/api/v1/inspections?limit=10')
        ]);

        setStats(statsRes.data.stats);
        setRecentInspections(recentRes.data.data || []);
      } catch (apiError) {
        console.warn('Backend not available, using mock data:', apiError);
        setUsingMockData(true);
        
        // Fallback to comprehensive mock data for development
        setStats({
          total_today: 5,
          total_week: 23,
          total_month: 87,
          pending: 3,
          completed: 12,
          approved: 8,
          rejected: 1,
          pass_rate: 85.5,
          avg_duration: 45,
          critical_issues: 2
        });

        setRecentInspections([
          {
            id: '1',
            vehicle_registration: 'MH12AB1234',
            vehicle_make: 'Tata',
            vehicle_model: 'Ace',
            inspector_name: 'John Doe',
            status: 'completed',
            overall_rating: 8.5,
            pass_fail: 'pass',
            created_at: new Date().toISOString(),
            has_critical_issues: false
          },
          {
            id: '2',
            vehicle_registration: 'MH12CD5678',
            vehicle_make: 'Ashok Leyland',
            vehicle_model: '407',
            inspector_name: 'Jane Smith',
            status: 'completed',
            overall_rating: 7.2,
            pass_fail: 'conditional',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            has_critical_issues: true
          },
          {
            id: '3',
            vehicle_registration: 'MH12EF9012',
            vehicle_make: 'Mahindra',
            vehicle_model: 'Bolero',
            inspector_name: 'Mike Johnson',
            status: 'pending',
            overall_rating: 6.8,
            pass_fail: 'fail',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            has_critical_issues: true
          },
          {
            id: '4',
            vehicle_registration: 'MH12GH3456',
            vehicle_make: 'Eicher',
            vehicle_model: 'Pro 1049',
            inspector_name: 'Sarah Wilson',
            status: 'approved',
            overall_rating: 9.1,
            pass_fail: 'pass',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            has_critical_issues: false
          },
          {
            id: '5',
            vehicle_registration: 'MH12IJ7890',
            vehicle_make: 'Force',
            vehicle_model: 'Traveller',
            inspector_name: 'David Brown',
            status: 'rejected',
            overall_rating: 4.2,
            pass_fail: 'fail',
            created_at: new Date(Date.now() - 345600000).toISOString(),
            has_critical_issues: true
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.status.normal;
      case 'pending': return colors.status.warning;
      case 'rejected': return colors.status.critical;
      case 'approved': return colors.status.normal;
      default: return colors.neutral[400];
    }
  };

  const getPassFailColor = (passFail: string) => {
    switch (passFail) {
      case 'pass': return colors.status.normal;
      case 'fail': return colors.status.critical;
      case 'conditional': return colors.status.warning;
      default: return colors.neutral[400];
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🔍</div>
        <div style={{ color: colors.neutral[600] }}>Loading inspection dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <NetworkError
          error={error}
          onRetry={fetchDashboardData}
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Mock Data Notice */}
      {usingMockData && (
        <div style={{
          marginBottom: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.status.warning + '20',
          border: `1px solid ${colors.status.warning}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <div style={{ ...typography.label, color: colors.status.warning, marginBottom: spacing.xs }}>
              🚧 Development Mode
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[700], marginBottom: spacing.sm }}>
              Laravel backend not configured. Showing mock inspection data for demonstration.
            </div>
            <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('https://laravel.com/docs', '_blank')}
              >
                📚 Setup Laravel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('https://github.com/laravel/laravel', '_blank')}
              >
                🔧 Backend Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '28px',
            color: colors.neutral[900],
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            🔍 Vehicle Inspections
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Comprehensive vehicle inspection and reporting system
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            icon="⬅️"
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/app/inspections/new')}
            icon="➕"
          >
            Start Inspection
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ marginBottom: spacing.xl }}>
        <StatsGrid gap="lg">
          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.primary}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-primary" />
              📊 Today's Inspections
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.primary,
              fontWeight: 700
            }}>
              {stats?.total_today || 0}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.status.normal}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-normal" />
              ✅ Pass Rate
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.normal,
              fontWeight: 700
            }}>
              {stats?.pass_rate ? `${Math.round(stats.pass_rate)}%` : '0%'}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.status.warning}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-warning" />
              ⏳ Pending
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.warning,
              fontWeight: 700
            }}>
              {stats?.pending || 0}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.status.critical}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-critical" />
              ⚠️ Critical Issues
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.critical,
              fontWeight: 700
            }}>
              {stats?.critical_issues || 0}
            </div>
          </div>
        </StatsGrid>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          🚀 Quick Actions
        </h3>
        
        <ActionGrid gap="md">
          <div
            onClick={() => navigate('/app/inspections/new')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.primary}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🔍</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Start New Inspection
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Begin vehicle inspection
            </div>
          </div>

          <div
            onClick={() => navigate('/app/inspections/completed')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.normal}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📋</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              View All Inspections
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Browse completed inspections
            </div>
          </div>

          <div
            onClick={() => navigate('/app/inspections/templates')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.warning}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📝</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Templates
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Manage inspection templates
            </div>
          </div>

          <div
            onClick={() => navigate('/app/inspections/reports')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.normal}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Reports & Analytics
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              View inspection analytics
            </div>
          </div>
        </ActionGrid>
      </div>

      {/* Recent Inspections */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <h3 style={{ 
            ...typography.subheader,
            margin: 0,
            color: colors.neutral[900]
          }}>
            📋 Recent Inspections
          </h3>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/inspections/completed')}
            icon="👁️"
          >
            View All
          </Button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {recentInspections.map((inspection) => (
            <div
              key={inspection.id}
              onClick={() => navigate(`/app/inspections/${inspection.id}`)}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: spacing.sm
              }}>
                <div>
                  <h4 style={{ 
                    ...typography.subheader,
                    marginBottom: spacing.xs,
                    color: colors.neutral[900]
                  }}>
                    {inspection.vehicle_make} {inspection.vehicle_model}
                  </h4>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    marginBottom: spacing.xs
                  }}>
                    {inspection.vehicle_registration} • {inspection.inspector_name}
                  </p>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[500],
                    fontSize: '12px'
                  }}>
                    {new Date(inspection.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: spacing.xs
                }}>
                  <div style={{ 
                    ...typography.subheader,
                    color: colors.neutral[900],
                    fontWeight: 700
                  }}>
                    {inspection.overall_rating}/10
                  </div>
                  <div style={{ display: 'flex', gap: spacing.xs }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getStatusColor(inspection.status),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {inspection.status}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getPassFailColor(inspection.pass_fail),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {inspection.pass_fail}
                    </span>
                  </div>
                  {inspection.has_critical_issues && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: colors.status.critical,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      ⚠️ Critical Issues
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recentInspections.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No Recent Inspections"
            description="Start your first vehicle inspection to see it appear here."
            action={{
              label: "Start Inspection",
              onClick: () => navigate('/app/inspections/new'),
              icon: "➕"
            }}
          />
        )}
      </div>
    </div>
  );
};
