/**
 * Vehicle Cost Dashboard
 * 
 * Super Admin Only - View vehicle cost tracking
 * Shows cost breakdown per vehicle, category-wise costs, and trends
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { useVehicleCosts } from '../../hooks/useVehicleCosts';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { DollarSign, TrendingUp, Car, BarChart3, Calendar, Filter } from 'lucide-react';
import { RequireRole } from '../../components/RequireAuth';

const EXPENSE_CATEGORIES = [
  'FUEL',
  'PARTS_REPAIR',
  'RTO_COMPLIANCE',
  'DRIVER_PAYMENT',
  'TOLLS_PARKING',
  'LOCAL_TRANSPORT',
  'INTERCITY_TRAVEL',
  'LODGING',
  'FOOD',
  'RECHARGE',
  'CONSUMABLES_MISC',
  'VENDOR_AGENT_FEE',
  'MISC',
];

export const VehicleCostDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: vehicleCosts = [], isLoading } = useVehicleCosts({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    enabled: user?.role === 'super_admin',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter by search term
  const filteredCosts = vehicleCosts.filter(cost => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cost.vehicleRegistration?.toLowerCase().includes(search) ||
      cost.vehicleId.toLowerCase().includes(search)
    );
  });

  // Calculate totals
  const totals = {
    totalCost: filteredCosts.reduce((sum, c) => sum + c.totalCost, 0),
    totalExpenses: filteredCosts.reduce((sum, c) => sum + c.expenseCount, 0),
    vehicleCount: filteredCosts.length,
  };

  // Sort by total cost (descending)
  const sortedCosts = [...filteredCosts].sort((a, b) => b.totalCost - a.totalCost);

  return (
    <RequireRole roles={['super_admin']}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: spacing.xl,
        minHeight: '100dvh',
        backgroundColor: colors.neutral[50],
      }}>
        <PageHeader
          title="Vehicle Cost Dashboard"
          subtitle="Track costs per vehicle (Super Admin Only)"
          icon="💰"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/home', icon: '🏠' },
            { label: 'Admin', path: '/app/admin/users', icon: '⚙️' },
            { label: 'Vehicle Costs', icon: '💰' },
          ]}
        />

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg, marginBottom: spacing.xl }}>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <DollarSign size={32} color={colors.primary} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Cost
            </div>
            <div style={{ ...typography.header, color: colors.primary, fontWeight: 700 }}>
              {formatCurrency(totals.totalCost)}
            </div>
          </Card>

          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <Car size={32} color={colors.info[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Vehicles Tracked
            </div>
            <div style={{ ...typography.header, color: colors.info[500], fontWeight: 700 }}>
              {totals.vehicleCount}
            </div>
          </Card>

          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <BarChart3 size={32} color={colors.success[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Expenses
            </div>
            <div style={{ ...typography.header, color: colors.success[500], fontWeight: 700 }}>
              {totals.totalExpenses}
            </div>
          </Card>

          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <TrendingUp size={32} color={colors.warning[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Avg Cost/Vehicle
            </div>
            <div style={{ ...typography.header, color: colors.warning[500], fontWeight: 700 }}>
              {totals.vehicleCount > 0 ? formatCurrency(totals.totalCost / totals.vehicleCount) : formatCurrency(0)}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <Filter size={20} color={colors.neutral[600]} />
            <h3 style={{ ...typography.subheader, margin: 0 }}>Filters</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
            <div>
              <Label>Search Vehicle</Label>
              <Input
                type="text"
                placeholder="Search by registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginTop: spacing.xs }}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ marginTop: spacing.xs }}
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ marginTop: spacing.xs }}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ marginTop: spacing.xs }}
              />
            </div>
          </div>
        </Card>

        {/* Vehicle Cost List */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} variant="card" style={{ height: '120px' }} />
            ))}
          </div>
        ) : sortedCosts.length === 0 ? (
          <EmptyState
            icon={<Car size={48} color={colors.neutral[500]} />}
            title="No Vehicle Costs Found"
            description="Vehicle costs will appear here when expenses are linked to vehicles."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {sortedCosts.map((cost) => (
              <Card
                key={cost.vehicleId}
                onClick={() => navigate(`/app/admin/vehicles/${cost.vehicleId}/costs`)}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h3 style={{ ...typography.subheader, fontSize: '18px', margin: `0 0 ${spacing.xs} 0` }}>
                      {cost.vehicleRegistration || cost.vehicleId}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
                      <span style={{
                        backgroundColor: colors.primary + '15',
                        color: colors.primary,
                        padding: '4px 8px',
                        borderRadius: borderRadius.full,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {cost.expenseCount} expenses
                      </span>
                      {cost.lastExpenseDate && (
                        <span style={{
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[700],
                          padding: '4px 8px',
                          borderRadius: borderRadius.full,
                          fontSize: '12px',
                        }}>
                          Last: {new Date(cost.lastExpenseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...typography.header, fontSize: '24px', color: colors.primary, fontWeight: 700 }}>
                      {formatCurrency(cost.totalCost)}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                      Total Cost
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {Object.keys(cost.costByCategory).length > 0 && (
                  <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral[200]}` }}>
                    <div style={{ ...typography.label, marginBottom: spacing.xs, color: colors.neutral[600] }}>
                      Cost by Category:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                      {Object.entries(cost.costByCategory)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([category, amount]) => (
                          <span
                            key={category}
                            style={{
                              backgroundColor: colors.neutral[100],
                              color: colors.neutral[700],
                              padding: '4px 8px',
                              borderRadius: borderRadius.sm,
                              fontSize: '11px',
                            }}
                          >
                            {category.replace(/_/g, ' ')}: {formatCurrency(amount)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
};



