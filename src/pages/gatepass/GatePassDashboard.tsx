import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { VisitorGatePass, VehicleMovementPass, DashboardStats } from './gatePassTypes';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import PassDisplay from '../../components/ui/PassDisplay';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { postWithCsrf, putWithCsrf } from '../../lib/csrf';

// 🚪 Gate Pass Dashboard
// Main screen for office staff to manage all gate passes
// Shows active passes, allows creating new ones, and quick actions

export const GatePassDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [visitorPasses, setVisitorPasses] = useState<VisitorGatePass[]>([]);
  const [vehicleMovements, setVehicleMovements] = useState<VehicleMovementPass[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    visitors_inside: 0,
    vehicles_out: 0,
    expected_today: 0,
    total_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('active');
  const [selectedPass, setSelectedPass] = useState<{
    id: number;
    passType: 'visitor' | 'vehicle';
    visitorName?: string;
    vehicleDetails?: {
      registration: string;
      make: string;
      model: string;
    };
    purpose: string;
    entryTime: string;
    expectedReturn?: string;
    companyName?: string;
    companyLogo?: string;
  } | null>(null);

  const fetchPasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map frontend filter to backend status values
      const getStatusFilter = (filter: string) => {
        switch (filter) {
          case 'active':
            return 'active'; // Show active passes
          case 'pending':
            return 'pending';
          case 'all':
          default:
            return undefined; // No filter
        }
      };

      // Fetch visitor passes
      const visitorResponse = await axios.get('/api/visitor-gate-passes', {
        params: { status: getStatusFilter(filter) }
      });


        // Fetch vehicle movements (both entry and exit passes) with status filtering
      const vehicleEntryResponse = await axios.get('/api/vehicle-entry-passes', {
        params: { status: getStatusFilter(filter) }
      });
      const vehicleExitResponse = await axios.get('/api/vehicle-exit-passes', {
        params: { status: getStatusFilter(filter) }
      });
      
      // Combine both entry and exit passes
      const vehicleEntryData = Array.isArray(vehicleEntryResponse.data) 
        ? vehicleEntryResponse.data 
        : (vehicleEntryResponse.data.data || []);
      const vehicleExitData = Array.isArray(vehicleExitResponse.data) 
        ? vehicleExitResponse.data 
        : (vehicleExitResponse.data.data || []);
      
      const vehicleResponse = { data: [...vehicleEntryData, ...vehicleExitData] };

        // Handle Laravel API response format (wrapped in { data: [] })
      const visitorData = Array.isArray(visitorResponse.data) 
      ? visitorResponse.data 
      : ((visitorResponse.data as any)?.data || []);

      const vehicleData = Array.isArray(vehicleResponse.data) 
      ? vehicleResponse.data 
      : ((vehicleResponse.data as any)?.data || []);

      console.log('Fetched visitor passes:', visitorData);
      console.log('Fetched vehicle movements:', vehicleData);
      
      // Debug today's date and visitor pass dates
      const today = new Date().toISOString().split('T')[0];
      console.log('Today:', today);
      visitorData.forEach((pass: any, index: number) => {
        console.log(`Pass ${index}:`, {
          id: pass.id,
          status: pass.status,
          valid_from: pass.valid_from,
          valid_from_date: pass.valid_from ? pass.valid_from.split('T')[0] : 'null'
        });
      });
      
      setVisitorPasses(visitorData);
      setVehicleMovements(vehicleData);

      // Calculate stats
    const visitorsInside = visitorData.filter((p: VisitorGatePass) =>  // ✅ CORRECT
    p.status === 'inside'
    ).length;

    const vehiclesOut = vehicleData.filter((v: VehicleMovementPass) =>  // ✅ CORRECT
    v.status === 'out'
    ).length;

    const expectedToday = visitorData.filter((p: VisitorGatePass) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Check if valid_from date matches today
    const validFromDate = p.valid_from ? p.valid_from.split('T')[0] : null;
    if (validFromDate !== today) return false;
    
    // Check if pass has expired (valid_to is in the past)
    if (p.valid_to) {
      const validToDate = new Date(p.valid_to);
      if (validToDate < now) return false; // Pass has expired
    }
    
    // Only count pending or active passes that haven't expired
    return p.status === 'pending' || p.status === 'active';
    }).length;

    setStats({
    visitors_inside: visitorsInside,
    vehicles_out: vehiclesOut,
    expected_today: expectedToday,
    total_today: visitorData.length + vehicleData.length  // ✅ CORRECT
    });

    } catch (error) {
      console.error('Failed to fetch passes:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPasses();
    }, [fetchPasses]);

  const handleMarkExit = async (passId: number, type: 'visitor' | 'vehicle') => {
    if (!confirm('Mark this pass as exited?')) return;

    try {
      if (type === 'visitor') {
        await postWithCsrf(`/api/visitor-gate-passes/${passId}/exit`);
      } else {
        await putWithCsrf(`/api/vehicle-exit-passes/${passId}`, {
          status: 'completed'
        });
      }
      alert('Exit marked successfully!');
      fetchPasses(); // Refresh data
    } catch (error) {
      console.error('Failed to mark exit:', error);
      alert('Failed to mark exit. Please try again.');
    }
  };


  const handleDownloadPDF = async (passId: number, type: 'visitor' | 'vehicle') => {
    try {
      // Find the pass data
      const pass = type === 'visitor' 
        ? visitorPasses.find(p => p.id === passId)
        : vehicleMovements.find(p => p.id === passId);
      
      if (!pass) {
        alert('Pass not found');
        return;
      }

      // Import the PDF generation functions
      const { generatePDFPass, generateAccessCode, formatPassNumber } = await import('../../lib/pdf-generator-simple');
      
      // Prepare pass data for PDF generation
      const passData = {
        passNumber: formatPassNumber(type, passId),
        passType: type,
        visitorName: type === 'visitor' ? (pass as any).visitor_name : (pass as any).driver_name,
        vehicleDetails: type === 'vehicle' ? {
          registration: (pass as any).vehicle?.registration_number || '',
          make: (pass as any).vehicle?.make || '',
          model: (pass as any).vehicle?.model || ''
        } : undefined,
        purpose: pass.purpose,
        entryTime: type === 'visitor' ? (pass as any).valid_from || new Date().toISOString() : (pass as any).departure_time || new Date().toISOString(),
        expectedReturn: (pass as any).expected_return_date,
        accessCode: generateAccessCode(),
        qrCode: '', // Will be generated by the PDF generator
        companyName: 'VOMS',
        companyLogo: ''
      };

      // Generate and download PDF
      const pdfBlob = await generatePDFPass(passData);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-${formatPassNumber(type, passId)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleSharePass = async (passId: number, type: 'visitor' | 'vehicle') => {
    try {
      // Find the pass data
      const pass = type === 'visitor' 
        ? visitorPasses.find(p => p.id === passId)
        : vehicleMovements.find(p => p.id === passId);
      
      if (!pass) {
        alert('Pass not found');
        return;
      }

      // Import the sharing functions
      const { sharePass, generateAccessCode, formatPassNumber } = await import('../../lib/pdf-generator-simple');
      
      // Prepare pass data for sharing
      const passData = {
        passNumber: formatPassNumber(type, passId),
        passType: type,
        visitorName: type === 'visitor' ? (pass as any).visitor_name : (pass as any).driver_name,
        vehicleDetails: type === 'vehicle' ? {
          registration: (pass as any).vehicle?.registration_number || '',
          make: (pass as any).vehicle?.make || '',
          model: (pass as any).vehicle?.model || ''
        } : undefined,
        purpose: pass.purpose,
        entryTime: type === 'visitor' ? (pass as any).valid_from || new Date().toISOString() : (pass as any).departure_time || new Date().toISOString(),
        expectedReturn: (pass as any).expected_return_date,
        accessCode: generateAccessCode(),
        qrCode: '', // Will be generated by the PDF generator
        companyName: 'VOMS',
        companyLogo: ''
      };

      // Share the pass
      await sharePass(passData);
    } catch (error) {
      console.error('Error sharing pass:', error);
      alert('Failed to share pass. Please try again.');
    }
  };


  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      inside: { backgroundColor: '#10B981', color: 'white' },
      out: { backgroundColor: '#F59E0B', color: 'white' },
      pending: { backgroundColor: '#6B7280', color: 'white' },
      completed: { backgroundColor: '#3B82F6', color: 'white' },
      cancelled: { backgroundColor: '#EF4444', color: 'white' }
    };

    const labels: Record<string, string> = {
      inside: '🟢 Inside Now',
      out: '🟡 Out for RTO',
      pending: '⏳ Pending Entry',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled'
    };

    return (
      <span style={{
        ...styles[status],
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 500
      }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
        <div style={{ color: colors.neutral[600] }}>Loading gate passes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <PageHeader
          title="Gate Pass Management"
          subtitle="Manage visitor passes, vehicle movements, and gate operations"
          icon="🚪"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
            { label: 'Gate Pass', icon: '🚪' }
          ]}
        />
        <NetworkError
          error={error}
          onRetry={fetchPasses}
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: `${spacing.xl} ${spacing.lg}`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl
    }}>
      {/* Header */}
      <PageHeader
        title="Gate Pass Management"
        subtitle="Manage visitor passes, vehicle movements, and gate operations"
        icon="🚪"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
          { label: 'Gate Pass', icon: '🚪' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {(['all', 'active', 'pending'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(filterOption)}
            >
                {filterOption}
              </Button>
            ))}
          </div>
        }
      />

      {/* Action Cards */}
      <ActionGrid gap="lg">
        {/* Create Visitor Pass */}
        <div
          onClick={() => navigate('/app/gate-pass/create-visitor')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.primary}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.15)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            👥
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Create Visitor Pass
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            For clients & inspections
          </div>
        </div>

        {/* Create Vehicle Movement */}
        <div
          onClick={() => navigate('/app/gate-pass/create-vehicle')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.brand}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 139, 0, 0.15)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🚗
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Create Vehicle Movement
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Track in/out movements
          </div>
        </div>

        {/* Guard Register */}
        <div
          onClick={() => navigate('/app/gate-pass/guard-register')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.success}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.success;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.success;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📊
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            View Guard Register
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Today's activity log
          </div>
        </div>

        {/* Reports & Analytics */}
        <div
          onClick={() => navigate('/app/gate-pass/reports')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.primary}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📈
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Reports & Analytics
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Comprehensive reporting and analytics
          </div>
        </div>

        {/* Pass Templates */}
        <div
          onClick={() => navigate('/app/gate-pass/templates')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.warning}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.15)';
            e.currentTarget.style.borderColor = colors.status.warning;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.warning;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📋
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Pass Templates
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Saved templates for common passes
          </div>
        </div>

        {/* Visitor Management */}
        <div
          onClick={() => navigate('/app/gate-pass/visitors')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.normal}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            👥
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Visitor Management
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Manage visitor database and history
          </div>
        </div>

        {/* Calendar View */}
        <div
          onClick={() => navigate('/app/gate-pass/calendar')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.error}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = colors.status.error;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.error;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📅
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Calendar View
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Calendar view of all gate passes
          </div>
        </div>

        {/* Pass Validation */}
        <div
          onClick={() => navigate('/app/gate-pass/validation')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.brand}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 139, 0, 0.15)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🛡️
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Pass Validation
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            QR code scanning and validation
          </div>
        </div>

        {/* Pass Approval */}
        <div
          onClick={() => navigate('/app/gate-pass/approval')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.success}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.status.success;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.success;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            ✅
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Pass Approval
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Multi-level approval workflow
          </div>
        </div>

        {/* Bulk Operations */}
        <div
          onClick={() => navigate('/app/gate-pass/bulk')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.normal}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🔄
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Bulk Operations
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Bulk create, update, and export
          </div>
        </div>
      </ActionGrid>

      {/* Stats Row */}
      <StatsGrid gap="lg">
        <div style={{ 
          ...cardStyles.base,
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.normal}`,
          position: 'relative' as const,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: '16px'
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
            👥 Visitors Inside
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.status.normal,
            fontWeight: 700
          }}>
            {stats.visitors_inside}
          </div>
        </div>
        
        <div style={{ 
          ...cardStyles.base,
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.warning}`,
          position: 'relative' as const,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: '16px'
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
            🚗 Vehicles Out
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.status.warning,
            fontWeight: 700
          }}>
            {stats.vehicles_out}
          </div>
        </div>
        
        <div style={{ 
          ...cardStyles.base,
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.primary}`,
          position: 'relative' as const,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: '16px'
        }}>
          <div style={{ 
            ...typography.label,
            color: colors.neutral[600], 
            marginBottom: spacing.xs,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: colors.primary,
              display: 'inline-block'
            }} />
            ⏳ Expected Today
          </div>
          <div style={{ 
            ...typography.header,
            fontSize: '32px',
            color: colors.primary,
            fontWeight: 700
          }}>
            {stats.expected_today}
          </div>
        </div>
      </StatsGrid>

      {/* Filters */}
      <div style={{ 
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {(['all', 'active', 'pending'] as const).map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            style={{
              padding: '0.5rem 1rem',
              border: filter === filterOption ? '2px solid #3B82F6' : '1px solid #D1D5DB',
              borderRadius: '6px',
              backgroundColor: filter === filterOption ? '#EFF6FF' : 'white',
              color: filter === filterOption ? '#3B82F6' : '#6B7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Active Passes Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          marginBottom: spacing.lg,
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          📋 Active Gate Passes
        </h2>

      {/* Visitor Passes */}
      {visitorPasses.filter(pass => {
        // Filter out expired passes
        if (pass.valid_to) {
          const validToDate = new Date(pass.valid_to);
          const now = new Date();
          if (validToDate < now) return false; // Pass has expired
        }
        return true;
      }).map(pass => (
        <div
          key={pass.id}
          style={{
            padding: spacing.xl,
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            backgroundColor: 'white',
            marginBottom: spacing.lg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Pass #{pass.id ? `VP${pass.id.substring(0, 8).toUpperCase()}` : 'N/A'}
              </div>
              {getStatusBadge(pass.status)}
            </div>
          </div>

          <div style={{ 
            display: 'grid',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            <div>👤 {pass.visitor_name}</div>
            <div>📅 Scheduled: {pass.valid_from ? new Date(pass.valid_from).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) : 'Not scheduled'}</div>
            <div>🎯 Purpose: {pass.purpose.toUpperCase()}</div>
            {pass.vehicles && pass.vehicles.length > 0 && (
              <div>🚗 Inspecting: {pass.vehicles.map(v => v.registration_number).join(', ')}</div>
            )}
            {pass.entry_time && (
              <div>⏰ Entry: {new Date(pass.entry_time).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            )}
            {pass.visitor_company && (
              <div>🏢 Company: {pass.visitor_company}</div>
            )}
            {pass.visitor_phone && (
              <div>📞 Phone: {pass.visitor_phone}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.md }}>
            <button
              onClick={() => setSelectedPass({
                id: pass.id!,
                passType: 'visitor',
                visitorName: pass.visitor_name,
                purpose: pass.purpose,
                entryTime: pass.valid_from || new Date().toISOString(),
                expectedReturn: pass.expected_return_date,
                companyName: 'VOMS'
              })}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #3B82F6',
                borderRadius: '6px',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              👁️ View Pass
            </button>
            <button
              onClick={() => handleDownloadPDF(pass.id!, 'visitor')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              📄 Download PDF
            </button>
            <button
              onClick={() => handleSharePass(pass.id!, 'visitor')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              📤 Share
            </button>
            {pass.status === 'inside' && (
              <button
                onClick={() => handleMarkExit(pass.id!, 'visitor')}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                ✓ Mark Exit
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Vehicle Movements */}
      {vehicleMovements.filter(movement => {
        // Filter out expired vehicle movements
        if (movement.expected_return_date) {
          const expectedReturnDate = new Date(movement.expected_return_date);
          const now = new Date();
          if (expectedReturnDate < now) return false; // Movement has expired
        }
        return true;
      }).map(movement => (
        <div
          key={movement.id}
          style={{
            padding: spacing.xl,
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            backgroundColor: 'white',
            marginBottom: spacing.lg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Vehicle Movement #{movement.pass_number}
              </div>
              {getStatusBadge(movement.status)}
            </div>
          </div>

          <div style={{ 
            display: 'grid',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            <div>🚗 Vehicle: {movement.vehicle?.registration_number} - {movement.vehicle?.make} {movement.vehicle?.model}</div>
            {movement.driver_name && <div>👤 Driver: {movement.driver_name}</div>}
            <div>📋 Purpose: {movement.purpose.replace('_', ' ').toUpperCase()}</div>
            {movement.departure_time && (
              <div>🕒 Left: {new Date(movement.departure_time).toLocaleString()}</div>
            )}
            {movement.expected_return_date && (
              <div>⏰ Expected Return: {new Date(movement.expected_return_date).toLocaleDateString()}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.md }}>
            <button
              onClick={() => setSelectedPass({
                id: movement.id!,
                passType: 'vehicle',
                vehicleDetails: {
                  registration: movement.vehicle?.registration_number || '',
                  make: movement.vehicle?.make || '',
                  model: movement.vehicle?.model || ''
                },
                purpose: movement.purpose,
                entryTime: movement.departure_time || movement.created_at || new Date().toISOString(),
                expectedReturn: movement.expected_return_date,
                companyName: 'VOMS'
              })}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #3B82F6',
                borderRadius: '6px',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              👁️ View Pass
            </button>
            <button
              onClick={() => handleDownloadPDF(movement.id!, 'vehicle')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              📄 Download PDF
            </button>
            <button
              onClick={() => handleSharePass(movement.id!, 'vehicle')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              📤 Share
            </button>
            {movement.status === 'out' && (
              <button
                onClick={() => navigate(`/app/gate-pass/vehicle/${movement.id}/return`)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                ✓ Mark Return
              </button>
            )}
          </div>
        </div>
      ))}

        {/* Empty State */}
        {visitorPasses.length === 0 && vehicleMovements.length === 0 && (
          <EmptyState
            icon="📋"
            title="No Gate Passes Found"
            description="Get started by creating your first visitor pass or vehicle movement pass."
            action={{
              label: "Create Visitor Pass",
              onClick: () => navigate('/app/gate-pass/create-visitor'),
              icon: "👤"
            }}
            secondaryAction={{
              label: "Create Vehicle Pass",
              onClick: () => navigate('/app/gate-pass/create-vehicle'),
              icon: "🚗"
            }}
          />
        )}
      </div>

      {/* Pass Display Modal */}
      {selectedPass && (
        <PassDisplay
          passData={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
};