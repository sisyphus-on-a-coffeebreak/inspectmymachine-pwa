import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid, WideGrid } from '../../components/ui/ResponsiveGrid';

// 🏗️ Asset Management Dashboard
// Asset-wise expense tracking and ROI analysis
// Shows asset performance, maintenance costs, and profitability

interface AssetSummary {
  id: string;
  name: string;
  type: 'vehicle' | 'equipment' | 'building' | 'technology';
  registration_number?: string;
  status: 'active' | 'maintenance' | 'retired';
  total_expenses: number;
  monthly_expenses: number;
  maintenance_cost: number;
  fuel_cost: number;
  repair_cost: number;
  other_cost: number;
  roi_percentage: number;
  utilization_rate: number;
  last_maintenance: string;
  next_maintenance: string;
  depreciation_value: number;
  current_value: number;
  purchase_date: string;
  purchase_price: number;
}

interface AssetExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  project_name?: string;
  maintenance_type?: 'scheduled' | 'emergency' | 'preventive';
  receipt_url?: string;
}

interface AssetPerformance {
  asset_id: string;
  asset_name: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  cost_per_hour: number;
  utilization_hours: number;
  efficiency_score: number;
}

export const AssetManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetSummary | null>(null);
  const [assetExpenses, setAssetExpenses] = useState<AssetExpense[]>([]);
  const [assetPerformance, setAssetPerformance] = useState<AssetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [filterType, setFilterType] = useState<'all' | 'vehicle' | 'equipment' | 'building' | 'technology'>('all');

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/assets/management', {
        params: { period: selectedPeriod, type: filterType }
      });
      setAssets(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, filterType]);

  const fetchAssetExpenses = useCallback(async (assetId: string) => {
    try {
      const response = await apiClient.get(`/v1/assets/${assetId}/expenses`, {
        params: { period: selectedPeriod }
      });
      setAssetExpenses(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setAssetExpenses([]);
    }
  }, [selectedPeriod]);

  const fetchAssetPerformance = useCallback(async () => {
    try {
      const response = await apiClient.get('/v1/assets/performance', {
        params: { period: selectedPeriod }
      });
      setAssetPerformance(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setAssetPerformance([]);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAssets();
    fetchAssetPerformance();
  }, [fetchAssets, fetchAssetPerformance]);

  useEffect(() => {
    if (selectedAsset) {
      fetchAssetExpenses(selectedAsset.id);
    }
  }, [selectedAsset, fetchAssetExpenses]);

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return '🚗';
      case 'equipment': return '🔧';
      case 'building': return '🏢';
      case 'technology': return '💻';
      default: return '🏗️';
    }
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'vehicle': return colors.primary;
      case 'equipment': return colors.status.success;
      case 'building': return colors.status.warning;
      case 'technology': return colors.status.normal;
      default: return colors.neutral[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.status.success;
      case 'maintenance': return colors.status.warning;
      case 'retired': return colors.status.error;
      default: return colors.neutral[400];
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 20) return colors.status.success;
    if (roi >= 10) return colors.status.warning;
    return colors.status.error;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏗️</div>
        <div style={{ color: '#6B7280' }}>Loading asset management dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: typography.body.fontFamily,
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
        border: '1px solid rgba(0,0,0,0,0.05)'
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
            🏗️ Asset Management
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Track asset performance, expenses, and ROI analysis
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
            icon="💰"
          >
            Expenses
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/app/expenses/asset/create')}
            icon="➕"
          >
            Add Asset
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
            <Label>Period:</Label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                marginLeft: spacing.sm
              }}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <Label>Asset Type:</Label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                marginLeft: spacing.sm
              }}
            >
              <option value="all">All Types</option>
              <option value="vehicle">Vehicles</option>
              <option value="equipment">Equipment</option>
              <option value="building">Buildings</option>
              <option value="technology">Technology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Performance Overview */}
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
          📊 Asset Performance Overview
        </h3>
        
        <StatsGrid gap="lg">
          <div style={{ 
            ...cardStyles.base,
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
              💰 Total Asset Value
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.primary,
              fontWeight: 700
            }}>
              ₹{assets.reduce((sum, asset) => sum + asset.current_value, 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
            border: `2px solid ${colors.status.success}`,
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
              📈 Average ROI
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.success,
              fontWeight: 700
            }}>
              {assets.length > 0 ? (assets.reduce((sum, asset) => sum + asset.roi_percentage, 0) / assets.length).toFixed(1) : 0}%
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
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
              💸 Monthly Expenses
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.warning,
              fontWeight: 700
            }}>
              ₹{assets.reduce((sum, asset) => sum + asset.monthly_expenses, 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
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
              🏗️ Active Assets
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.normal,
              fontWeight: 700
            }}>
              {assets.filter(asset => asset.status === 'active').length}
            </div>
          </div>
        </StatsGrid>
      </div>

      {/* Assets List */}
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
          🏗️ Assets ({assets.length})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: selectedAsset?.id === asset.id ? colors.primary + '10' : '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: spacing.sm
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: spacing.sm,
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>
                      {getAssetTypeIcon(asset.type)}
                    </div>
                    <h4 style={{ 
                      ...typography.subheader,
                      margin: 0,
                      color: colors.neutral[900]
                    }}>
                      {asset.name}
                    </h4>
                    {asset.registration_number && (
                      <span style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        backgroundColor: colors.neutral[100],
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {asset.registration_number}
                      </span>
                    )}
                  </div>
                  
                  <WideGrid gap="md" style={{ marginBottom: spacing.sm }}>
                    <div>
                      <div style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        Total Expenses
                      </div>
                      <div style={{ 
                        ...typography.subheader,
                        color: colors.neutral[900],
                        fontWeight: 600
                      }}>
                        ₹{asset.total_expenses.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        Monthly Expenses
                      </div>
                      <div style={{ 
                        ...typography.subheader,
                        color: colors.neutral[900],
                        fontWeight: 600
                      }}>
                        ₹{asset.monthly_expenses.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        ROI
                      </div>
                      <div style={{ 
                        ...typography.subheader,
                        color: getROIColor(asset.roi_percentage),
                        fontWeight: 600
                      }}>
                        {asset.roi_percentage.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        Utilization
                      </div>
                      <div style={{ 
                        ...typography.subheader,
                        color: colors.neutral[900],
                        fontWeight: 600
                      }}>
                        {asset.utilization_rate}%
                      </div>
                    </div>
                  </WideGrid>

                  <div style={{ 
                    display: 'flex', 
                    gap: spacing.sm,
                    marginBottom: spacing.sm,
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ 
                      ...typography.bodySmall,
                      color: getAssetTypeColor(asset.type),
                      backgroundColor: getAssetTypeColor(asset.type) + '20',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {asset.type.toUpperCase()}
                    </span>
                    <span style={{ 
                      ...typography.bodySmall,
                      color: getStatusColor(asset.status),
                      backgroundColor: getStatusColor(asset.status) + '20',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {asset.status.toUpperCase()}
                    </span>
                    <span style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      backgroundColor: colors.neutral[100],
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      Next Service: {new Date(asset.next_maintenance).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: spacing.sm
                }}>
                  <div style={{ 
                    ...typography.subheader,
                    color: colors.neutral[900],
                    fontWeight: 700,
                    fontSize: '18px'
                  }}>
                    ₹{asset.current_value.toLocaleString('en-IN')}
                  </div>
                  
                  <div style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    fontSize: '12px'
                  }}>
                    Current Value
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {assets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: colors.neutral[600]
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              No assets found
            </div>
            <div>
              Add your first asset to start tracking expenses
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



