import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import { ArrowLeft, Package, Battery, Wrench } from 'lucide-react';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { RelatedItems } from '../../components/ui/RelatedItems';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { useGatePasses } from '../../lib/queries';

/**
 * Gate Pass Details Page
 * Deep linking support for individual gate passes
 */
export const GatePassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pass, setPass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch related gate passes for the same vehicle
  const { data: relatedPassesData } = useGatePasses(
    undefined, // No status filter - we'll filter client-side
    { enabled: !!pass?.vehicle_id }
  );
  
  // Filter related passes for the same vehicle, excluding current pass
  const relatedPasses = useMemo(() => {
    if (!pass?.vehicle_id || !relatedPassesData) return [];
    
    // Add type field to passes
    const visitorPasses = (relatedPassesData.visitorPasses || []).map((p: any) => ({ ...p, type: 'visitor' }));
    const vehiclePasses = (relatedPassesData.vehicleMovements || []).map((p: any) => ({ ...p, type: 'vehicle' }));
    
    const allPasses = [...visitorPasses, ...vehiclePasses];
    
    return allPasses
      .filter((p: any) => {
        // Match by vehicle_id or vehicle_registration
        const matchesVehicle = p.vehicle_id === pass.vehicle_id || 
                               p.vehicle?.id === pass.vehicle_id ||
                               p.vehicle_registration === pass.vehicle_registration;
        // Exclude current pass
        const isNotCurrent = p.id !== id;
        return matchesVehicle && isNotCurrent;
      })
      .slice(0, 5); // Limit to 5 most recent
  }, [pass?.vehicle_id, pass?.vehicle_registration, relatedPassesData, id]);

  useEffect(() => {
    if (!id) return;
    fetchPassDetails();
  }, [id]);

  const fetchPassDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      let passData: any = null;
      // Try visitor pass first, then vehicle pass
      try {
        const response = await apiClient.get(`/visitor-gate-passes/${id}`);
        passData = { ...response.data, type: 'visitor' };
        setPass(passData);
      } catch {
        // Try vehicle exit pass
        const response = await apiClient.get(`/vehicle-exit-passes/${id}`);
        passData = { ...response.data, type: 'vehicle' };
        setPass(passData);
      }
      
      // Track in recently viewed
      if (passData && id) {
        addRecentlyViewed({
          id: String(id),
          type: 'gate-pass',
          title: passData.type === 'visitor' 
            ? `Visitor Pass #${id.substring(0, 8)}`
            : `Vehicle Pass #${id.substring(0, 8)}`,
          subtitle: passData.type === 'visitor' 
            ? passData.visitor_name || 'Visitor Gate Pass'
            : passData.vehicle?.registration_number || 'Vehicle Movement Pass',
          path: `/app/gate-pass/${id}`,
        });
      }
    } catch (err) {
      setError(err as Error);
      showToast({
        title: 'Error',
        description: 'Failed to load gate pass details',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🚪</div>
        <div style={{ color: colors.neutral[600] }}>Loading gate pass details...</div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <NetworkError
          error={error || new Error('Gate pass not found')}
          onRetry={fetchPassDetails}
          onGoBack={() => navigate('/app/gate-pass')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={`Gate Pass #${id?.substring(0, 8)}`}
        subtitle={pass.type === 'visitor' ? 'Visitor Gate Pass' : 'Vehicle Movement Pass'}
        icon="🚪"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Gate Passes', path: '/app/gate-pass' },
          { label: 'Details' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/gate-pass')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
        }
      />

      {/* Policy Links */}
      <PolicyLinks
        title="Gate Pass Policy & Guidelines"
        links={[
          {
            label: 'Gate Pass Policy',
            url: '/policies/gate-pass-policy',
            external: false,
            icon: '📋'
          },
          {
            label: 'Visitor Management',
            url: '/policies/visitor-management',
            external: false,
            icon: '👥'
          },
          {
            label: 'Vehicle Movement Rules',
            url: '/policies/vehicle-movement',
            external: false,
            icon: '🚗'
          }
        ]}
        variant="compact"
      />

      {/* Anomaly Alerts */}
      {pass && (() => {
        const now = new Date();
        const anomalies = [];

        // Check for visitor inside > 8 hours
        if (pass.type === 'visitor' && pass.entry_time) {
          const entryTime = new Date(pass.entry_time);
          const hoursInside = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
          if (hoursInside > 8 && pass.status === 'active') {
            anomalies.push({
              title: 'Visitor Inside > 8 Hours',
              description: `This visitor has been inside for ${Math.floor(hoursInside)} hours. Please verify their status.`,
              severity: 'warning' as const,
            });
          }
        }

        // Check for vehicle exit without return scan
        if (pass.type === 'vehicle' && pass.direction === 'outbound' && pass.exit_time && !pass.return_time) {
          const exitTime = new Date(pass.exit_time);
          const hoursOut = (now.getTime() - exitTime.getTime()) / (1000 * 60 * 60);
          if (hoursOut > 24) {
            anomalies.push({
              title: 'Vehicle Out > 24 Hours',
              description: `This vehicle has been out for ${Math.floor(hoursOut)} hours without a return scan.`,
              severity: 'warning' as const,
            });
          }
        }

        // Check for expired pass still active
        if (pass.valid_until) {
          const validUntil = new Date(pass.valid_until);
          if (validUntil < now && pass.status === 'active') {
            anomalies.push({
              title: 'Pass Expired But Still Active',
              description: `This pass expired on ${validUntil.toLocaleDateString()}. Please review and update its status.`,
              severity: 'error' as const,
            });
          }
        }

        return anomalies.length > 0 ? (
          <div style={{ marginTop: spacing.lg }}>
            {anomalies.map((anomaly, index) => (
              <AnomalyAlert
                key={`anomaly-${anomaly.title || anomaly.id || index}`}
                title={anomaly.title}
                description={anomaly.description}
                severity={anomaly.severity}
                dismissible={false}
              />
            ))}
          </div>
        ) : null;
      })()}

      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Pass Information</h3>
        <div style={{ display: 'grid', gap: spacing.md }}>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>Type</div>
            <div style={{ ...typography.body }}>{pass.type === 'visitor' ? 'Visitor' : 'Vehicle'}</div>
          </div>
          {pass.visitor_name && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Visitor Name</div>
              <div style={{ ...typography.body }}>{pass.visitor_name}</div>
            </div>
          )}
          {pass.vehicle_registration && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Vehicle</div>
              <div style={{ ...typography.body }}>{pass.vehicle_registration}</div>
            </div>
          )}
          {pass.purpose && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Purpose</div>
              <div style={{ ...typography.body }}>{pass.purpose}</div>
            </div>
          )}
          {pass.status && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Status</div>
              <div style={{ ...typography.body }}>{pass.status}</div>
            </div>
          )}
        </div>
      </div>

      {/* Linked Expenses */}
      {pass.linked_expenses && pass.linked_expenses.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Linked Expenses</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            The following expenses are linked to this gate pass:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {pass.linked_expenses.map((expense: any) => {
              const reasonLabels: Record<string, string> = {
                'same_vehicle': 'Same Vehicle',
                'same_date': 'Same Date',
                'keyword_match': 'Keyword Match',
                'same_project': 'Same Project',
              };
              
              return (
                <div
                  key={expense.id}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ ...typography.body, fontWeight: 600 }}>
                      ₹{expense.amount.toLocaleString('en-IN')} - {expense.category}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {expense.description || 'No description'} • {reasonLabels[expense.link_reason] || expense.link_reason} ({(expense.confidence_score * 100).toFixed(0)}% match)
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                      {new Date(expense.date).toLocaleDateString('en-IN')} • Status: {expense.status}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/expenses/${expense.id}`)}
                    style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Transfers */}
      {pass.components_removed && pass.components_removed.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Components Removed</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            The following components were automatically removed from this vehicle when the exit pass was created:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {pass.components_removed.map((component: any) => {
              const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
                battery: { icon: Battery, label: 'Battery', color: colors.primary },
                tyre: { icon: Package, label: 'Tyre', color: colors.warning[500] },
                spare_part: { icon: Wrench, label: 'Spare Part', color: colors.success[500] },
              };
              const config = typeConfig[component.component_type] || { icon: Package, label: 'Component', color: colors.neutral[500] };
              const Icon = config.icon;
              
              return (
                <div
                  key={`${component.component_type}-${component.component_id}`}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                  }}
                >
                  <Icon size={20} color={config.color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...typography.body, fontWeight: 600 }}>{component.component_name}</div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {config.label} • Removed on {new Date(component.transferred_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/stockyard/components/${component.component_type}/${component.component_id}`)}
                    style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Items */}
      {pass.vehicle_id && (
        <div style={{ marginTop: spacing.lg, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
          {/* Related Gate Passes Panel */}
          {relatedPasses.length > 0 && (
            <RelatedItems
              title="Related Gate Passes"
              items={relatedPasses.map((p: any) => ({
                id: p.id,
                title: p.type === 'visitor' 
                  ? `Visitor Pass #${p.id.substring(0, 8)}`
                  : `Vehicle Pass #${p.id.substring(0, 8)}`,
                subtitle: p.type === 'visitor'
                  ? `${p.visitor_name || 'Visitor'} - ${p.status || 'Unknown'}`
                  : `${p.vehicle?.registration_number || p.vehicle_registration || 'Vehicle'} - ${p.status || 'Unknown'}`,
                path: `/app/gate-pass/${p.id}`,
                icon: '🚪',
              }))}
              variant="compact"
            />
          )}
          
          <RelatedItems
            title="Vehicle History"
            items={[
              {
                id: 'all-passes',
                title: 'All Gate Passes',
                subtitle: `View all gate passes for this vehicle`,
                path: `/app/gate-pass?vehicle=${pass.vehicle_id}`,
                icon: '🚪',
              },
              {
                id: 'inspections',
                title: 'Recent Inspections',
                subtitle: 'View inspection history for this vehicle',
                path: `/app/inspections?vehicle=${pass.vehicle_id}`,
                icon: '🔍',
              },
            ]}
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};

