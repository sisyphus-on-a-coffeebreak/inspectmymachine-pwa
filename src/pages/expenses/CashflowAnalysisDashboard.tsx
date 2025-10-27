import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';

// 💹 Cashflow Analysis Dashboard
// Comprehensive cashflow analysis for assets and projects
// Shows ROI, profitability, cost efficiency, and investment decisions

interface CashflowSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  cash_flow_positive: boolean;
  monthly_trend: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  asset_performance: Array<{
    asset_id: string;
    asset_name: string;
    revenue: number;
    expenses: number;
    profit: number;
    roi_percentage: number;
    cost_efficiency: number;
  }>;
  project_performance: Array<{
    project_id: string;
    project_name: string;
    revenue: number;
    expenses: number;
    profit: number;
    profit_margin: number;
    cost_per_deliverable: number;
  }>;
}

interface InvestmentAnalysis {
  asset_id: string;
  asset_name: string;
  purchase_price: number;
  current_value: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  roi_percentage: number;
  payback_period_months: number;
  recommendation: 'keep' | 'replace' | 'upgrade' | 'sell';
  reason: string;
}

interface CostEfficiency {
  category: string;
  total_cost: number;
  output_units: number;
  cost_per_unit: number;
  efficiency_score: number;
  benchmark_cost: number;
  variance_percentage: number;
  recommendation: string;
}

export const CashflowAnalysisDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cashflowData, setCashflowData] = useState<CashflowSummary | null>(null);
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysis[]>([]);
  const [costEfficiency, setCostEfficiency] = useState<CostEfficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'assets' | 'projects' | 'efficiency'>('overview');

  const fetchCashflowData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/expenses/cashflow-analysis', {
        params: { period: selectedPeriod }
      });
      setCashflowData(response.data);
    } catch (error) {
      console.error('Failed to fetch cashflow data:', error);
      // Mock data for development
      setCashflowData({
        total_revenue: 2500000,
        total_expenses: 1800000,
        net_profit: 700000,
        profit_margin: 28,
        cash_flow_positive: true,
        monthly_trend: [
          { month: '2024-01', revenue: 800000, expenses: 600000, profit: 200000 },
          { month: '2024-02', revenue: 850000, expenses: 620000, profit: 230000 },
          { month: '2024-03', revenue: 900000, expenses: 650000, profit: 250000 },
          { month: '2024-04', revenue: 950000, expenses: 680000, profit: 270000 }
        ],
        asset_performance: [
          {
            asset_id: '1',
            asset_name: 'Vehicle ABC-1234',
            revenue: 500000,
            expenses: 125000,
            profit: 375000,
            roi_percentage: 300,
            cost_efficiency: 85
          },
          {
            asset_id: '2',
            asset_name: 'Laptop Dell XPS',
            revenue: 200000,
            expenses: 25000,
            profit: 175000,
            roi_percentage: 700,
            cost_efficiency: 95
          }
        ],
        project_performance: [
          {
            project_id: '1',
            project_name: 'Project Alpha',
            revenue: 1200000,
            expenses: 450000,
            profit: 750000,
            profit_margin: 62.5,
            cost_per_deliverable: 15000
          },
          {
            project_id: '2',
            project_name: 'Project Beta',
            revenue: 800000,
            expenses: 720000,
            profit: 80000,
            profit_margin: 10,
            cost_per_deliverable: 24000
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  const fetchInvestmentAnalysis = useCallback(async () => {
    try {
      const response = await axios.get('/api/expenses/investment-analysis', {
        params: { period: selectedPeriod }
      });
      setInvestmentAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch investment analysis:', error);
      // Mock data for development
      setInvestmentAnalysis([
        {
          asset_id: '1',
          asset_name: 'Vehicle ABC-1234',
          purchase_price: 300000,
          current_value: 225000,
          total_revenue: 500000,
          total_expenses: 125000,
          net_profit: 375000,
          roi_percentage: 125,
          payback_period_months: 8,
          recommendation: 'keep',
          reason: 'High ROI and good performance'
        },
        {
          asset_id: '2',
          asset_name: 'Laptop Dell XPS',
          purchase_price: 50000,
          current_value: 35000,
          total_revenue: 200000,
          total_expenses: 25000,
          net_profit: 175000,
          roi_percentage: 350,
          payback_period_months: 3,
          recommendation: 'keep',
          reason: 'Excellent ROI and efficiency'
        }
      ]);
    }
  }, [selectedPeriod]);

  const fetchCostEfficiency = useCallback(async () => {
    try {
      const response = await axios.get('/api/expenses/cost-efficiency', {
        params: { period: selectedPeriod }
      });
      setCostEfficiency(response.data);
    } catch (error) {
      console.error('Failed to fetch cost efficiency:', error);
      // Mock data for development
      setCostEfficiency([
        {
          category: 'Labor',
          total_cost: 800000,
          output_units: 1000,
          cost_per_unit: 800,
          efficiency_score: 85,
          benchmark_cost: 750,
          variance_percentage: 6.7,
          recommendation: 'Optimize workforce allocation'
        },
        {
          category: 'Materials',
          total_cost: 400000,
          output_units: 500,
          cost_per_unit: 800,
          efficiency_score: 90,
          benchmark_cost: 850,
          variance_percentage: -5.9,
          recommendation: 'Good cost control'
        },
        {
          category: 'Equipment',
          total_cost: 200000,
          output_units: 200,
          cost_per_unit: 1000,
          efficiency_score: 75,
          benchmark_cost: 900,
          variance_percentage: 11.1,
          recommendation: 'Review equipment utilization'
        }
      ]);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchCashflowData();
    fetchInvestmentAnalysis();
    fetchCostEfficiency();
  }, [fetchCashflowData, fetchInvestmentAnalysis, fetchCostEfficiency]);

  const getProfitColor = (profit: number) => {
    if (profit > 0) return colors.status.success;
    if (profit === 0) return colors.neutral[500];
    return colors.status.error;
  };

  const getROIColor = (roi: number) => {
    if (roi >= 50) return colors.status.success;
    if (roi >= 20) return colors.status.warning;
    return colors.status.error;
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return colors.status.success;
    if (score >= 70) return colors.status.warning;
    return colors.status.error;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'keep': return colors.status.success;
      case 'upgrade': return colors.status.warning;
      case 'replace': return colors.status.error;
      case 'sell': return colors.neutral[500];
      default: return colors.neutral[400];
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💹</div>
        <div style={{ color: '#6B7280' }}>Loading cashflow analysis...</div>
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
            💹 Cashflow Analysis
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Comprehensive financial analysis and investment insights
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
            onClick={() => navigate('/app/expenses/reports')}
            icon="📊"
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters and View Selector */}
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
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <Label>View:</Label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                marginLeft: spacing.sm
              }}
            >
              <option value="overview">Overview</option>
              <option value="assets">Asset Analysis</option>
              <option value="projects">Project Analysis</option>
              <option value="efficiency">Cost Efficiency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      {selectedView === 'overview' && cashflowData && (
        <>
          {/* Key Metrics */}
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
              📊 Financial Overview
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
                  💰 Total Revenue
                </div>
                <div style={{ 
                  ...typography.header,
                  fontSize: '32px',
                  color: colors.primary,
                  fontWeight: 700
                }}>
                  ₹{cashflowData.total_revenue.toLocaleString('en-IN')}
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
                  💸 Total Expenses
                </div>
                <div style={{ 
                  ...typography.header,
                  fontSize: '32px',
                  color: colors.status.warning,
                  fontWeight: 700
                }}>
                  ₹{cashflowData.total_expenses.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ 
                ...cardStyles.base,
                padding: spacing.xl,
                backgroundColor: 'white',
                border: `2px solid ${getProfitColor(cashflowData.net_profit)}`,
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
                  📈 Net Profit
                </div>
                <div style={{ 
                  ...typography.header,
                  fontSize: '32px',
                  color: getProfitColor(cashflowData.net_profit),
                  fontWeight: 700
                }}>
                  ₹{cashflowData.net_profit.toLocaleString('en-IN')}
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
                  📊 Profit Margin
                </div>
                <div style={{ 
                  ...typography.header,
                  fontSize: '32px',
                  color: colors.status.normal,
                  fontWeight: 700
                }}>
                  {cashflowData.profit_margin.toFixed(1)}%
                </div>
              </div>
            </StatsGrid>
          </div>

          {/* Monthly Trend Chart */}
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
              📈 Monthly Trend
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {cashflowData.monthly_trend.map((month, index) => (
                <div key={index} style={{
                  padding: spacing.lg,
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#F9FAFB'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <h4 style={{ 
                      ...typography.subheader,
                      margin: 0,
                      color: colors.neutral[900]
                    }}>
                      {new Date(month.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </h4>
                    <div style={{ 
                      ...typography.subheader,
                      color: getProfitColor(month.profit),
                      fontWeight: 700
                    }}>
                      ₹{month.profit.toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: spacing.md
                  }}>
                    <div>
                      <div style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        Revenue
                      </div>
                      <div style={{ 
                        ...typography.subheader,
                        color: colors.primary,
                        fontWeight: 600
                      }}>
                        ₹{month.revenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        Expenses
                      </div>
                      <div style={{ 
                        ...typography.subheader,
                        color: colors.status.warning,
                        fontWeight: 600
                      }}>
                        ₹{month.expenses.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Asset Analysis Section */}
      {selectedView === 'assets' && cashflowData && (
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
            🏗️ Asset Performance Analysis
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {cashflowData.asset_performance.map((asset) => (
              <div key={asset.asset_id} style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      ...typography.subheader,
                      marginBottom: spacing.sm,
                      color: colors.neutral[900]
                    }}>
                      {asset.asset_name}
                    </h4>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: spacing.md,
                      marginBottom: spacing.sm
                    }}>
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Revenue
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.primary,
                          fontWeight: 600
                        }}>
                          ₹{asset.revenue.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Expenses
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.status.warning,
                          fontWeight: 600
                        }}>
                          ₹{asset.expenses.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Profit
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: getProfitColor(asset.profit),
                          fontWeight: 600
                        }}>
                          ₹{asset.profit.toLocaleString('en-IN')}
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
                      color: getEfficiencyColor(asset.cost_efficiency),
                      fontWeight: 700,
                      fontSize: '18px'
                    }}>
                      {asset.cost_efficiency}%
                    </div>
                    
                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      fontSize: '12px'
                    }}>
                      Efficiency Score
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Analysis */}
      {selectedView === 'assets' && investmentAnalysis.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: spacing.xl,
          marginTop: spacing.xl,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.subheader,
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            💡 Investment Recommendations
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {investmentAnalysis.map((investment) => (
              <div key={investment.asset_id} style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      ...typography.subheader,
                      marginBottom: spacing.sm,
                      color: colors.neutral[900]
                    }}>
                      {investment.asset_name}
                    </h4>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: spacing.md,
                      marginBottom: spacing.sm
                    }}>
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Purchase Price
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.neutral[900],
                          fontWeight: 600
                        }}>
                          ₹{investment.purchase_price.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Current Value
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.neutral[900],
                          fontWeight: 600
                        }}>
                          ₹{investment.current_value.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Net Profit
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: getProfitColor(investment.net_profit),
                          fontWeight: 600
                        }}>
                          ₹{investment.net_profit.toLocaleString('en-IN')}
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
                          color: getROIColor(investment.roi_percentage),
                          fontWeight: 600
                        }}>
                          {investment.roi_percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      marginTop: spacing.sm
                    }}>
                      Payback Period: {investment.payback_period_months} months
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: spacing.sm
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getRecommendationColor(investment.recommendation),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {investment.recommendation}
                    </span>
                    
                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      fontSize: '12px',
                      textAlign: 'right',
                      maxWidth: '200px'
                    }}>
                      {investment.reason}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



