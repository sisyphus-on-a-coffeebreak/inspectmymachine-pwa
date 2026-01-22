/**
 * Anomaly Alerts Component
 * Displays alerts for anomalies in gate pass data
 */

import React from 'react';
import { AnomalyAlert } from '@/components/ui/AnomalyAlert';
import { VEHICLE_OUT_ALERT_HOURS, VISITOR_LONG_STAY_HOURS, GATE_PASS_TYPE, GATE_PASS_STATUS } from '../../constants';
import type { GatePass } from '../../gatePassTypes';

interface AnomalyAlertsProps {
  passes: GatePass[];
  onFilterChange: (filter: { status?: string; type?: string }) => void;
}

export const AnomalyAlerts: React.FC<AnomalyAlertsProps> = ({
  passes,
  onFilterChange,
}) => {
  const now = new Date();
  const longStayThreshold = new Date(now.getTime() - VISITOR_LONG_STAY_HOURS * 60 * 60 * 1000);
  
  // Check for visitors inside > threshold hours
  const longStayVisitors = passes.filter((pass) => {
    if (pass.pass_type !== GATE_PASS_TYPE.VISITOR) return false;
    if (pass.status !== GATE_PASS_STATUS.INSIDE || !pass.entry_time) return false;
    const entryTime = new Date(pass.entry_time);
    return entryTime < longStayThreshold;
  });

  // Check for expired but still active passes
  const expiredActive = passes.filter((pass) => {
    if (pass.status !== GATE_PASS_STATUS.ACTIVE && pass.status !== GATE_PASS_STATUS.INSIDE) return false;
    if (!pass.valid_to) return false;
    return new Date(pass.valid_to) < now;
  });

  // Check for vehicles out without return scan
  const vehiclesOutLong = passes.filter((pass) => {
    if (pass.pass_type === GATE_PASS_TYPE.VISITOR) return false;
    if (pass.status !== GATE_PASS_STATUS.INSIDE || !pass.entry_time) return false; // inside = out for vehicles
    const exitTime = new Date(pass.entry_time);
    const hoursOut = (now.getTime() - exitTime.getTime()) / (1000 * 60 * 60);
    return hoursOut > VEHICLE_OUT_ALERT_HOURS;
  });

  return (
    <>
      {longStayVisitors.length > 0 && (
        <AnomalyAlert
          title={`${longStayVisitors.length} Visitor${longStayVisitors.length > 1 ? 's' : ''} Inside > ${VISITOR_LONG_STAY_HOURS} Hours`}
          description={`Some visitors have been inside for more than ${VISITOR_LONG_STAY_HOURS} hours. Please verify their status.`}
          severity="warning"
          actions={[
            {
              label: 'View Long Stay Visitors',
              onClick: () => onFilterChange({ status: GATE_PASS_STATUS.INSIDE, type: GATE_PASS_TYPE.VISITOR }),
              variant: 'primary',
            },
          ]}
        />
      )}
      {expiredActive.length > 0 && (
        <AnomalyAlert
          title={`${expiredActive.length} Expired Pass${expiredActive.length > 1 ? 'es' : ''} Still Active`}
          description="Some passes have expired but are still marked as active. Please review and update their status."
          severity="error"
          actions={[
            {
              label: 'Review Expired Passes',
              onClick: () => onFilterChange({ status: 'all' }), // 'all' is a filter value, not a status
              variant: 'primary',
            },
          ]}
        />
      )}
      {vehiclesOutLong.length > 0 && (
        <AnomalyAlert
          title={`${vehiclesOutLong.length} Vehicle${vehiclesOutLong.length > 1 ? 's' : ''} Out > 24 Hours`}
          description="Some vehicles have been out for more than 24 hours without a return scan."
          severity="warning"
          actions={[
            {
              label: 'View Vehicles Out',
              onClick: () => onFilterChange({ status: GATE_PASS_STATUS.INSIDE, type: 'vehicle' }),
              variant: 'primary',
            },
          ]}
        />
      )}
    </>
  );
};

