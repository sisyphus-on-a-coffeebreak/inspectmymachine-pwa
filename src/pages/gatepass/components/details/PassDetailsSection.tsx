/**
 * Pass Details Section Component
 * Displays comprehensive pass information
 */

import React from 'react';
import { colors, typography, spacing, cardStyles } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { isVisitorPass, isOutboundVehicle } from '../../gatePassTypes';
import type { GatePass } from '../../gatePassTypes';

interface PassDetailsSectionProps {
  pass: GatePass;
  statusTheme: string;
  timeInside: string | null;
  formatDateTime: (date: string | null) => string;
}

export const PassDetailsSection: React.FC<PassDetailsSectionProps> = ({
  pass,
  statusTheme,
  timeInside,
  formatDateTime,
}) => {
  return (
    <div style={{
      ...cardStyles.base,
      padding: spacing.xl,
      marginTop: spacing.lg,
      borderTop: `4px solid ${statusTheme}`,
    }}>
      <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
        Pass Details
      </h2>

      <div style={{ display: 'grid', gap: spacing.lg }}>
        {/* Visitor Details */}
        {isVisitorPass(pass) && (
          <>
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Visitor Name
              </div>
              <div style={{ ...typography.body, fontWeight: 600 }}>
                {pass.visitor_name || 'N/A'}
              </div>
            </div>
            
            {pass.visitor_phone && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Phone
                </div>
                <div style={{ ...typography.body }}>
                  {pass.visitor_phone}
                </div>
              </div>
            )}
            
            {pass.visitor_company && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Company
                </div>
                <div style={{ ...typography.body }}>
                  {pass.visitor_company}
                </div>
              </div>
            )}
            
            {pass.referred_by && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Referred By
                </div>
                <div style={{ ...typography.body }}>
                  {pass.referred_by}
                </div>
              </div>
            )}
            
            {pass.additional_visitors && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Additional Visitors
                </div>
                <div style={{ ...typography.body }}>
                  {pass.additional_visitors}
                  {pass.additional_head_count && pass.additional_head_count > 0 && (
                    <span style={{ color: colors.neutral[600], marginLeft: spacing.xs }}>
                      ({pass.additional_head_count} {pass.additional_head_count === 1 ? 'person' : 'people'})
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {pass.vehicles_to_view && pass.vehicles_to_view.length > 0 && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Vehicles to View
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                  {pass.vehicles_to_view.map((vehicleId, idx) => (
                    <Badge key={idx} variant="neutral" size="sm">
                      {vehicleId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Vehicle Details */}
        {!isVisitorPass(pass) && (
          <>
            {pass.vehicle && (
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Vehicle
                </div>
                <div style={{ ...typography.body, fontWeight: 600 }}>
                  {pass.vehicle.registration_number}
                </div>
                <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
                  {pass.vehicle.make} {pass.vehicle.model} {pass.vehicle.year && `(${pass.vehicle.year})`}
                </div>
              </div>
            )}
            
            {isOutboundVehicle(pass) && (
              <>
                {pass.driver_name && (
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Driver Name
                    </div>
                    <div style={{ ...typography.body }}>
                      {pass.driver_name}
                    </div>
                  </div>
                )}
                
                {pass.driver_contact && (
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Driver Contact
                    </div>
                    <div style={{ ...typography.body }}>
                      {pass.driver_contact}
                    </div>
                  </div>
                )}
                
                {pass.destination && (
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Destination
                    </div>
                    <div style={{ ...typography.body }}>
                      {pass.destination}
                    </div>
                  </div>
                )}
                
                {pass.expected_return_date && (
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Expected Return
                    </div>
                    <div style={{ ...typography.body }}>
                      {formatDateTime(pass.expected_return_date)}
                      {pass.expected_return_time && ` at ${pass.expected_return_time}`}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Common Details */}
        <div>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Purpose
          </div>
          <div style={{ ...typography.body, textTransform: 'capitalize' }}>
            {pass.purpose.replace('_', ' ')}
          </div>
        </div>

        <div>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Valid From
          </div>
          <div style={{ ...typography.body }}>
            {formatDateTime(pass.valid_from)}
          </div>
        </div>

        <div>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Valid To
          </div>
          <div style={{ ...typography.body }}>
            {formatDateTime(pass.valid_to)}
          </div>
        </div>

        {pass.entry_time && (
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Entry Time
            </div>
            <div style={{ ...typography.body, color: colors.success[500] }}>
              {formatDateTime(pass.entry_time)}
              {timeInside && (
                <span style={{ marginLeft: spacing.sm, color: colors.neutral[600] }}>
                  ({timeInside} ago)
                </span>
              )}
            </div>
          </div>
        )}

        {pass.exit_time && (
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Exit Time
            </div>
            <div style={{ ...typography.body, color: colors.neutral[700] }}>
              {formatDateTime(pass.exit_time)}
            </div>
          </div>
        )}

        {pass.creator && (
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Created By
            </div>
            <div style={{ ...typography.body }}>
              {pass.creator.name}
            </div>
          </div>
        )}

        {pass.yard && (
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Yard
            </div>
            <div style={{ ...typography.body }}>
              {pass.yard.name}
            </div>
          </div>
        )}

        {pass.notes && (
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Notes
            </div>
            <div style={{ ...typography.body, whiteSpace: 'pre-wrap' }}>
              {pass.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

