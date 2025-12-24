import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatsGrid, CardGrid } from '../../components/ui/ResponsiveGrid';
import { useToast } from '../../providers/ToastProvider';
import { LineChart, BarChart } from '../../components/ui/charts';
import { ExportButton } from '../../components/ui/ExportButton';
import { getApiUrl } from '../../lib/apiConfig';

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
  const { showToast } = useToast();
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
      const statsResponse = await apiClient.get('/v1/gate-pass-reports/summary', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined
        }
      });

      // Fetch trend data
      const trendsResponse = await apiClient.get('/v1/gate-pass-reports/analytics', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined
        }
      });

      // Fetch popular times
      const timesResponse = await apiClient.get('/v1/gate-pass-reports/dashboard', {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined
        }
      });

      // Fetch yard statistics
      const yardsResponse = await apiClient.get('/v1/gate-pass-reports/yards');

      setStats(statsResponse.data);
      // Transform daily_trends from backend format to frontend format
      const dailyTrends = statsResponse.data?.daily_trends || [];
      const transformedTrends: PassTrend[] = Array.isArray(dailyTrends) 
        ? dailyTrends.map((item: any) => ({
            date: item.date || item.created_at || '',
            visitors: item.visitors || item.count || 0,
            vehicles: item.vehicles || 0,
            total: item.total || item.count || 0
          }))
        : [];
      setTrends(transformedTrends);
      // Popular times should come from dashboard or analytics
      const popularTimesData = timesResponse.data?.popular_times || statsResponse.data?.peak_hours || [];
      setPopularTimes(Array.isArray(popularTimesData) ? popularTimesData : []);
      setYardStats(Array.isArray(yardsResponse.data) ? yardsResponse.data : []);

    } catch (error) {
      // Show empty state instead of mock data
      setStats(null);
      setTrends([]);
      setPopularTimes([]);
      setYardStats([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedYard]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToCSV = async () => {
    try {
      // For blob responses, use axios directly with apiClient's CSRF handling
      const axios = (await import('axios')).default;
      const { apiClient: client } = await import('../../lib/apiClient');
      await (client as any).ensureCsrfToken?.();
      const csrfToken = (client as any).getCsrfToken?.();
      
      const response = await axios.get(getApiUrl('/v1/gate-pass-reports/export'), {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined,
          format: 'csv'
        },
        responseType: 'blob',
        withCredentials: true,
        headers: {
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        },
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
      showToast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'error',
      });
    }
  };

  const exportToPDF = async () => {
    try {
      // For blob responses, use axios directly with apiClient's CSRF handling
      const axios = (await import('axios')).default;
      const { apiClient: client } = await import('../../lib/apiClient');
      await (client as any).ensureCsrfToken?.();
      const csrfToken = (client as any).getCsrfToken?.();
      
      const response = await axios.get(getApiUrl('/v1/gate-pass-reports/export'), {
        params: { 
          date_range: dateRange,
          yard_id: selectedYard !== 'all' ? selectedYard : undefined,
          format: 'pdf'
        },
        responseType: 'blob',
        withCredentials: true,
        headers: {
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        },
      });

      // Check if response is actually a PDF (content-type should be application/pdf)
      if (response.headers['content-type']?.includes('application/pdf') || response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gate-pass-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showToast({
          title: 'Success',
          description: 'PDF exported successfully',
          variant: 'success',
        });
      } else {
        // If not a PDF, might be an error response
        const text = await response.data.text();
        try {
          const json = JSON.parse(text);
          if (json.message) {
            showToast({
              title: 'Error',
              description: json.message,
              variant: 'error',
            });
          }
        } catch {
          showToast({
            title: 'Error',
            description: 'Failed to export PDF. Please try again.',
            variant: 'error',
          });
        }
      }
    } catch (error: any) {
      if (error.response?.status === 501) {
        const errorMessage = error.response?.data?.message || 'PDF export is not yet implemented.';
        showToast({
          title: 'PDF Export Not Available',
          description: errorMessage,
          variant: 'warning',
        });
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to export PDF. Please try again.',
          variant: 'error',
        });
      }
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
          <ExportButton
            apiEndpoint="/v1/gate-pass-reports/export"
            apiParams={{
              date_range: dateRange,
              yard_id: selectedYard !== 'all' ? selectedYard : undefined,
            }}
            formats={['csv', 'excel', 'json']}
            options={{
              filename: `gate-pass-report-${dateRange}-${new Date().toISOString().split('T')[0]}`,
            }}
            label="Export Data"
            variant="secondary"
          />
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
      <CardGrid gap="xl" style={{ marginBottom: spacing.xl }}>
        {/* Trends Chart */}
        {trends.length > 0 && (
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
            <LineChart
              data={trends.map(trend => ({
                date: trend.date,
                visitors: trend.visitors,
                vehicles: trend.vehicles,
                total: trend.total
              }))}
              dataKeys={[
                { key: 'visitors', name: 'Visitors', color: colors.primary, strokeWidth: 2 },
                { key: 'vehicles', name: 'Vehicles', color: colors.success[500], strokeWidth: 2 },
                { key: 'total', name: 'Total', color: colors.warning[500], strokeWidth: 2 }
              ]}
              height={300}
              tooltipFormatter={(value) => [value.toString(), '']}
            />
          </div>
        )}

        {/* Popular Times Chart */}
        {popularTimes.length > 0 && (
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
            <BarChart
              data={popularTimes.map(time => ({
                hour: `${time.hour}:00`,
                count: time.count
              }))}
              dataKeys={[{
                key: 'count',
                name: 'Passes',
                color: colors.primary
              }]}
              xAxisKey="hour"
              height={300}
              tooltipFormatter={(value) => [`${value} passes`, '']}
            />
          </div>
        )}
      </CardGrid>

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
        <CardGrid gap="lg">
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
        </CardGrid>
      </div>
    </div>
  );
};

