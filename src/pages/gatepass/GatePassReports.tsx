import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatsGrid } from '../../components/ui/ResponsiveGrid';

// 📊 Gate Pass Reports & Analytics
// Comprehensive reporting dashboard for gate pass analytics
// Shows statistics, trends, and detailed reports

interface ReportStats {
  total_passes: number;
  visitor_passes: number;
  vehicle_passes: number;
  active_passes: number;
  completed_passes: number;
  cancelled_passes: number;
  today_passes: number;
  week_passes: number;
  month_passes: number;
}

interface PassTrend {
  date: string;
  visitors: number;
  vehicles: number;
  total: number;
}

interface PopularTimes {
  hour: number;
  count: number;
}

interface YardStats {
  yard_id: string;
  yard_name: string;
  pass_count: number;
  active_passes: number;
}

export const GatePassReports: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [trends, setTrends] = useState<PassTrend[]>([]);
  const [popularTimes, setPopularTimes] = useState<PopularTimes[]>([]);
  const [yardStats, setYardStats] = useState<YardStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedYard, setSelectedYard] = useState<string>('all');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch comprehensive statistics
      const statsResponse = await axios.get('/api/gate-pass-reports/summary', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined
        }
      });

      // Fetch trend data
      const trendsResponse = await axios.get('/api/gate-pass-reports/analytics', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined
        }
      });

      // Fetch popular times
      const timesResponse = await axios.get('/api/gate-pass-reports/dashboard', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined
        }
      });

      // Fetch yard statistics
      const yardsResponse = await axios.get('/api/gate-pass-reports/yards');

      setStats(statsResponse.data);
      setTrends(trendsResponse.data);
      setPopularTimes(timesResponse.data);
      setYardStats(yardsResponse.data);

    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Set mock data for development
      setStats({
        total_passes: 1247,
        visitor_passes: 892,
        vehicle_passes: 355,
        active_passes: 23,
        completed_passes: 1189,
        cancelled_passes: 35,
        today_passes: 45,
        week_passes: 234,
        month_passes: 1247
      });
      setTrends([
        { date: '2024-01-01', visitors: 12, vehicles: 8, total: 20 },
        { date: '2024-01-02', visitors: 15, vehicles: 6, total: 21 },
        { date: '2024-01-03', visitors: 18, vehicles: 9, total: 27 },
        { date: '2024-01-04', visitors: 14, vehicles: 7, total: 21 },
        { date: '2024-01-05', visitors: 16, vehicles: 10, total: 26 }
      ]);
      setPopularTimes([
        { hour: 9, count: 45 },
        { hour: 10, count: 67 },
        { hour: 11, count: 89 },
        { hour: 14, count: 78 },
        { hour: 15, count: 92 },
        { hour: 16, count: 56 }
      ]);
      setYardStats([
        { yard_id: 'yard1', yard_name: 'Main Yard', pass_count: 567, active_passes: 12 },
        { yard_id: 'yard2', yard_name: 'Secondary Yard', pass_count: 234, active_passes: 8 },
        { yard_id: 'yard3', yard_name: 'Storage Yard', pass_count: 123, active_passes: 3 }
      ]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedYard]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToCSV = async () => {
    try {
      const response = await axios.get('/api/gate-pass-reports/export', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined,
          format: 'csv'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await axios.get('/api/gate-pass-reports/export', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined,
          format: 'pdf'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <div style={{ color: '#6B7280' }}>Loading gate pass reports...</div>
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
            📊 Gate Pass Reports & Analytics
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Comprehensive analytics and reporting for gate pass operations
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={exportToCSV}
            icon="📊"
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={exportToPDF}
            icon="📄"
          >
            Export PDF
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            icon="🚪"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...typography.label, marginBottom: spacing.xs, display: 'block' }}>
              Yard
            </label>
            <select
              value={selectedYard}
              onChange={(e) => setSelectedYard(e.target.value)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
            >
              <option value="all">All Yards</option>
              {yardStats.map(yard => (
                <option key={yard.yard_id} value={yard.yard_id}>
                  {yard.yard_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <StatsGrid gap="lg">
        <div style={{ 
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.primary}`,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
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
            📊 Total Passes
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.primary,
            fontWeight: 700
          }}>
            {stats?.total_passes || 0}
          </div>
        </div>

        <div style={{ 
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.normal}`,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
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
            👥 Visitor Passes
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.status.normal,
            fontWeight: 700
          }}>
            {stats?.visitor_passes || 0}
          </div>
        </div>

        <div style={{ 
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.warning}`,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
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
            🚗 Vehicle Passes
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.status.warning,
            fontWeight: 700
          }}>
            {stats?.vehicle_passes || 0}
          </div>
        </div>

        <div style={{ 
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.normal}`,
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            ...typography.label,
            color: colors.neutral[600], 
            marginBottom: spacing.xs,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span className="status-dot status-dot-success" />
            ✅ Completed
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.status.normal,
            fontWeight: 700
          }}>
            {stats?.completed_passes || 0}
          </div>
        </div>
      </StatsGrid>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xl, marginBottom: spacing.xl }}>
        {/* Trends Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.subheader,
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            📈 Pass Trends
          </h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '4px' }}>
            {trends.map((trend, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1
              }}>
                <div style={{ 
                  height: `${(trend.total / Math.max(...trends.map(t => t.total))) * 200}px`,
                  backgroundColor: colors.primary,
                  width: '100%',
                  borderRadius: '4px 4px 0 0',
                  marginBottom: spacing.xs
                }} />
                <div style={{ fontSize: '12px', color: colors.neutral[600] }}>
                  {new Date(trend.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '10px', color: colors.neutral[500] }}>
                  {trend.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Times Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.subheader,
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            ⏰ Popular Times
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {popularTimes.map((time, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{ 
                  width: '40px', 
                  fontSize: '12px', 
                  color: colors.neutral[600],
                  textAlign: 'right'
                }}>
                  {time.hour}:00
                </div>
                <div style={{ 
                  flex: 1, 
                  height: '20px', 
                  backgroundColor: colors.neutral[200], 
                  borderRadius: '10px',
                  position: 'relative'
                }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: colors.primary,
                    borderRadius: '10px',
                    width: `${(time.count / Math.max(...popularTimes.map(t => t.count))) * 100}%`
                  }} />
                </div>
                <div style={{ 
                  width: '30px', 
                  fontSize: '12px', 
                  color: colors.neutral[600],
                  textAlign: 'right'
                }}>
                  {time.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yard Statistics */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          🏭 Yard Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
          {yardStats.map((yard) => (
            <div key={yard.yard_id} style={{
              padding: spacing.lg,
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              backgroundColor: '#F9FAFB'
            }}>
              <div style={{ 
                ...typography.subheader,
                marginBottom: spacing.sm,
                color: colors.neutral[900]
              }}>
                {yard.yard_name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <span style={{ color: colors.neutral[600] }}>Total Passes:</span>
                <span style={{ fontWeight: 600 }}>{yard.pass_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.neutral[600] }}>Active Passes:</span>
                <span style={{ fontWeight: 600, color: colors.primary }}>{yard.active_passes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

