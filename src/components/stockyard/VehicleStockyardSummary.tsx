/**
 * Vehicle Stockyard Summary Component
 * 
 * Shows stockyard-related information for a vehicle (can be used in vehicle detail pages)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../ui/button';
import { Car, Calendar, MapPin, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { useDaysSinceEntry, useStockyardAlerts } from '../../lib/queries';
import { DaysSinceEntryWidget } from './DaysSinceEntryWidget';

interface VehicleStockyardSummaryProps {
  vehicleId: string;
  vehicleRegistration?: string;
  stockyardRequestId?: string;
  compact?: boolean;
}

export const VehicleStockyardSummary: React.FC<VehicleStockyardSummaryProps> = ({
  vehicleId,
  vehicleRegistration,
  stockyardRequestId,
  compact = false,
}) => {
  const navigate = useNavigate();

  const { data: daysSinceEntryData } = useDaysSinceEntry(vehicleId);
  const { data: alertsData } = useStockyardAlerts({
    vehicle_id: vehicleId,
    acknowledged: false,
    severity: 'critical',
  });

  const daysSinceEntry = daysSinceEntryData?.find((d) => d.vehicle_id === vehicleId)?.days_since_entry || 0;
  const criticalAlerts = alertsData?.length || 0;

  if (compact) {
    return (
      <div style={{ ...cardStyles.card, padding: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
          {daysSinceEntry > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Calendar size={16} color={daysSinceEntry >= 30 ? colors.error[600] : colors.warning[600]} />
              <span style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                {daysSinceEntry} days in yard
              </span>
            </div>
          )}
          {criticalAlerts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <AlertTriangle size={16} color={colors.error[600]} />
              <span style={{ ...typography.bodySmall, color: colors.error[700] }}>
                {criticalAlerts} critical alert{criticalAlerts !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate(`/app/stockyard/vehicles/${vehicleId}/timeline`)}
          >
            View Timeline
          </Button>
          {stockyardRequestId && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => navigate(`/app/stockyard/${stockyardRequestId}`)}
            >
              View Request
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {daysSinceEntry > 0 && (
        <DaysSinceEntryWidget
          daysSinceEntry={daysSinceEntry}
          vehicleRegistration={vehicleRegistration}
          showAlert={true}
          alertThreshold={30}
        />
      )}

      {criticalAlerts > 0 && (
        <div
          style={{
            ...cardStyles.card,
            borderLeft: `4px solid ${colors.error[500]}`,
            backgroundColor: colors.error[50],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <AlertTriangle size={20} color={colors.error[600]} />
            <span style={{ ...typography.body, fontWeight: 600, color: colors.error[700] }}>
              {criticalAlerts} Critical Alert{criticalAlerts !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ ...typography.bodySmall, color: colors.error[700], marginBottom: spacing.sm }}>
            This vehicle has {criticalAlerts} unacknowledged critical alert{criticalAlerts !== 1 ? 's' : ''} that require attention.
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => navigate(`/app/stockyard/alerts?vehicle_id=${vehicleId}`)}
          >
            View Alerts
          </Button>
        </div>
      )}

      <div style={{ ...cardStyles.card }}>
        <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>
          Stockyard Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
          <Button
            variant="secondary"
            onClick={() => navigate(`/app/stockyard/vehicles/${vehicleId}/timeline`)}
            style={{ width: '100%' }}
          >
            <Calendar size={16} style={{ marginRight: spacing.xs }} />
            View Timeline
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/app/stockyard/vehicles/${vehicleId}/profitability`)}
            style={{ width: '100%' }}
          >
            <ShoppingBag size={16} style={{ marginRight: spacing.xs }} />
            Profitability
          </Button>
          {stockyardRequestId && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/${stockyardRequestId}`)}
              style={{ width: '100%' }}
            >
              <FileText size={16} style={{ marginRight: spacing.xs }} />
              View Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


