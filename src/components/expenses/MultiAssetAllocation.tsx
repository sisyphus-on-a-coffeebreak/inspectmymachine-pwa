/**
 * Multi-Asset Allocation Component
 * 
 * Allows allocating expense amount across multiple assets/vehicles
 * Supports three allocation methods:
 * 1. Equal division
 * 2. Specific amount per asset
 * 3. Percentage-based
 */

import React, { useState, useMemo } from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { UnifiedVehicleSelector } from '../../pages/gatepass/components/UnifiedVehicleSelector';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Calculator } from 'lucide-react';

export type AllocationMethod = 'equal' | 'specific' | 'percentage';

export interface AssetAllocation {
  assetId: string;
  assetName?: string;
  amount: number;
  percentage?: number;
}

interface MultiAssetAllocationProps {
  totalAmount: number;
  selectedAssetIds: string[];
  allocations: AssetAllocation[];
  onAssetIdsChange: (ids: string[]) => void;
  onAllocationsChange: (allocations: AssetAllocation[]) => void;
  allocationMethod: AllocationMethod;
  onAllocationMethodChange: (method: AllocationMethod) => void;
  error?: string;
}

export const MultiAssetAllocation: React.FC<MultiAssetAllocationProps> = ({
  totalAmount,
  selectedAssetIds,
  allocations,
  onAssetIdsChange,
  onAllocationsChange,
  allocationMethod,
  onAllocationMethodChange,
  error,
}) => {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Calculate allocations when method or assets change
  useMemo(() => {
    if (selectedAssetIds.length === 0) {
      onAllocationsChange([]);
      return;
    }

    if (allocationMethod === 'equal') {
      const amountPerAsset = totalAmount / selectedAssetIds.length;
      const newAllocations: AssetAllocation[] = selectedAssetIds.map(id => ({
        assetId: id,
        amount: amountPerAsset,
      }));
      onAllocationsChange(newAllocations);
    } else if (allocationMethod === 'percentage') {
      // Initialize with equal percentages
      const percentagePerAsset = 100 / selectedAssetIds.length;
      const newAllocations: AssetAllocation[] = selectedAssetIds.map(id => ({
        assetId: id,
        amount: (totalAmount * percentagePerAsset) / 100,
        percentage: percentagePerAsset,
      }));
      onAllocationsChange(newAllocations);
    } else {
      // Specific amount - initialize with equal amounts
      const amountPerAsset = totalAmount / selectedAssetIds.length;
      const newAllocations: AssetAllocation[] = selectedAssetIds.map(id => ({
        assetId: id,
        amount: amountPerAsset,
      }));
      onAllocationsChange(newAllocations);
    }
  }, [selectedAssetIds, allocationMethod, totalAmount]);

  const handleAmountChange = (assetId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newAllocations = allocations.map(a =>
      a.assetId === assetId
        ? { ...a, amount: numValue }
        : a
    );
    onAllocationsChange(newAllocations);
    validateAllocations(newAllocations);
  };

  const handlePercentageChange = (assetId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const amount = (totalAmount * numValue) / 100;
    const newAllocations = allocations.map(a =>
      a.assetId === assetId
        ? { ...a, percentage: numValue, amount }
        : a
    );
    onAllocationsChange(newAllocations);
    validateAllocations(newAllocations);
  };

  const validateAllocations = (allocs: AssetAllocation[]) => {
    const errors: Record<string, string> = {};
    const totalAllocated = allocs.reduce((sum, a) => sum + a.amount, 0);
    const difference = Math.abs(totalAmount - totalAllocated);

    if (difference > 0.01) {
      errors.total = `Total allocated (₹${totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) must equal expense amount (₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`;
    }

    // Check for negative amounts
    allocs.forEach(a => {
      if (a.amount < 0) {
        errors[a.assetId] = 'Amount cannot be negative';
      }
    });

    // Check percentages sum to 100
    if (allocationMethod === 'percentage') {
      const totalPercentage = allocs.reduce((sum, a) => sum + (a.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.percentage = `Percentages must sum to 100% (currently ${totalPercentage.toFixed(2)}%)`;
      }
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const difference = totalAmount - totalAllocated;
  const isValid = Math.abs(difference) < 0.01 && Object.keys(localErrors).length === 0;

  return (
    <div style={{
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      backgroundColor: colors.neutral[50],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <Calculator size={20} color={colors.primary} />
        <h3 style={{ ...typography.subheader, fontSize: '16px', margin: 0 }}>
          Multi-Asset Allocation
        </h3>
      </div>

      {/* Asset Selection */}
      <div style={{ marginBottom: spacing.lg }}>
        <Label>Select Assets/Vehicles</Label>
        <UnifiedVehicleSelector
          mode="multiple"
          value={selectedAssetIds}
          onChange={(ids) => onAssetIdsChange(Array.isArray(ids) ? ids : [])}
          label="Assets"
          minSelection={1}
          placeholder="Select one or more assets"
        />
      </div>

      {/* Allocation Method Selection */}
      {selectedAssetIds.length > 0 && (
        <>
          <div style={{ marginBottom: spacing.md }}>
            <Label>Allocation Method</Label>
            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xs }}>
              <button
                type="button"
                onClick={() => onAllocationMethodChange('equal')}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `2px solid ${allocationMethod === 'equal' ? colors.primary : colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  background: allocationMethod === 'equal' ? colors.primary + '15' : 'white',
                  color: allocationMethod === 'equal' ? colors.primary : colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: allocationMethod === 'equal' ? 600 : 400,
                }}
              >
                Equal (₹{selectedAssetIds.length > 0 ? (totalAmount / selectedAssetIds.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0'})
              </button>
              <button
                type="button"
                onClick={() => onAllocationMethodChange('specific')}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `2px solid ${allocationMethod === 'specific' ? colors.primary : colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  background: allocationMethod === 'specific' ? colors.primary + '15' : 'white',
                  color: allocationMethod === 'specific' ? colors.primary : colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: allocationMethod === 'specific' ? 600 : 400,
                }}
              >
                Specific Amount
              </button>
              <button
                type="button"
                onClick={() => onAllocationMethodChange('percentage')}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `2px solid ${allocationMethod === 'percentage' ? colors.primary : colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  background: allocationMethod === 'percentage' ? colors.primary + '15' : 'white',
                  color: allocationMethod === 'percentage' ? colors.primary : colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: allocationMethod === 'percentage' ? 600 : 400,
                }}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div style={{ marginBottom: spacing.md }}>
            <Label>Allocation Breakdown</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginTop: spacing.xs }}>
              {allocations.map((allocation, index) => (
                <div
                  key={allocation.assetId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.sm,
                    backgroundColor: 'white',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ ...typography.bodySmall, fontWeight: 600, marginBottom: spacing.xs }}>
                      Asset {index + 1} {allocation.assetName && `(${allocation.assetName})`}
                    </div>
                    {allocationMethod === 'percentage' ? (
                      <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={allocation.percentage?.toFixed(2) || '0'}
                          onChange={(e) => handlePercentageChange(allocation.assetId, e.target.value)}
                          style={{ width: '100px' }}
                          error={localErrors[allocation.assetId]}
                        />
                        <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>%</span>
                        <span style={{ ...typography.bodySmall, color: colors.neutral[600], flexGrow: 1 }}>
                          = ₹{allocation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={allocation.amount.toFixed(2)}
                        onChange={(e) => handleAmountChange(allocation.assetId, e.target.value)}
                        error={localErrors[allocation.assetId]}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{
            padding: spacing.md,
            backgroundColor: isValid ? colors.success[50] : colors.warning[50],
            border: `1px solid ${isValid ? colors.success[200] : colors.warning[200]}`,
            borderRadius: borderRadius.md,
            marginTop: spacing.md,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <span style={{ ...typography.bodySmall, fontWeight: 600 }}>Total Allocated:</span>
              <span style={{ ...typography.bodySmall, fontWeight: 600 }}>
                ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ ...typography.bodySmall }}>Expense Amount:</span>
              <span style={{ ...typography.bodySmall }}>
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {Math.abs(difference) > 0.01 && (
              <div style={{
                marginTop: spacing.xs,
                padding: spacing.xs,
                backgroundColor: colors.error[50],
                borderRadius: borderRadius.sm,
                color: colors.error[700],
                fontSize: '12px',
              }}>
                Difference: ₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2, signDisplay: 'always' })}
              </div>
            )}
            {(localErrors.total || localErrors.percentage) && (
              <div style={{
                marginTop: spacing.xs,
                color: colors.error[700],
                fontSize: '12px',
              }}>
                {localErrors.total || localErrors.percentage}
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div style={{
          marginTop: spacing.sm,
          padding: spacing.sm,
          backgroundColor: colors.error[50],
          borderRadius: borderRadius.sm,
          color: colors.error[700],
          fontSize: '12px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};


