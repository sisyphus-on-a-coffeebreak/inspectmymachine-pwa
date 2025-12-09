/**
 * Stockyard Analytics Page
 * 
 * Unified analytics dashboard consolidating:
 * - Cost Analysis
 * - Component Health
 * - Vehicle Profitability
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/button';
import { colors, spacing, typography } from '../../lib/theme';
import { ComponentCostAnalysis } from './ComponentCostAnalysis';
import { ComponentHealthDashboard } from './ComponentHealthDashboard';
import { ProfitabilityDashboard } from './ProfitabilityDashboard';

type AnalyticsTab = 'cost' | 'health' | 'profitability';

const analyticsTabs: Array<{ id: AnalyticsTab; label: string }> = [
  { id: 'cost', label: 'Cost Analysis' },
  { id: 'health', label: 'Component Health' },
  { id: 'profitability', label: 'Vehicle Profitability' },
];

export const StockyardAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL or default to cost
  const activeTab = (searchParams.get('tab') as AnalyticsTab) || 'cost';
  const [currentTab, setCurrentTab] = useState<AnalyticsTab>(activeTab);

  const handleTabChange = (tab: string) => {
    const tabId = tab as AnalyticsTab;
    setCurrentTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams, { replace: true });
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'cost':
        return <ComponentCostAnalysis />;
      case 'health':
        return <ComponentHealthDashboard />;
      case 'profitability':
        return <ProfitabilityDashboard />;
      default:
        return <ComponentCostAnalysis />;
    }
  };

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: spacing.xl,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: colors.neutral[50],
        minHeight: '100vh',
      }}
    >
      <PageHeader
        title="Stockyard Analytics"
        subtitle="Comprehensive stockyard analysis and reporting"
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Analytics' },
        ]}
        actions={
          <Button variant="secondary" onClick={() => navigate('/app/stockyard')}>
            Back to Stockyard
          </Button>
        }
      />

      {/* Tabs */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.md,
          marginBottom: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <SegmentedControl
          options={analyticsTabs.map((tab) => ({
            value: tab.id,
            label: tab.label,
          }))}
          value={currentTab}
          onChange={handleTabChange}
          fullWidth
        />
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.xl,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {renderTabContent()}
      </div>
    </div>
  );
};


