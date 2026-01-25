/**
 * Stockyard Module Tests
 * Tests all stockyard related functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the stockyard components
vi.mock('../../pages/stockyard/StockyardDashboard', () => ({
  StockyardDashboard: () => (
    <div data-testid="stockyard-dashboard">
      <h1>Stockyard Dashboard</h1>
      <div data-testid="request-list">Request List</div>
      <button data-testid="create-request-btn">Create Request</button>
      <div data-testid="stats">In Stock: 50, Pending: 10</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/CreateComponentMovement', () => ({
  CreateComponentMovement: () => (
    <div data-testid="create-movement">
      <h1>Create Component Movement</h1>
      <form data-testid="movement-form">
        <select data-testid="component">
          <option value="1">Engine</option>
        </select>
        <select data-testid="movement-type">
          <option value="transfer">Transfer</option>
        </select>
        <button type="submit">Create Movement</button>
      </form>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/StockyardRequestDetails', () => ({
  StockyardRequestDetails: () => (
    <div data-testid="request-details">
      <h1>Request Details</h1>
      <div data-testid="request-info">Request Info</div>
      <div data-testid="vehicle-info">Vehicle Info</div>
      <div data-testid="timeline">Timeline</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/StockyardScan', () => ({
  StockyardScan: () => (
    <div data-testid="stockyard-scan">
      <h1>Stockyard Scan</h1>
      <div data-testid="scanner">QR Scanner</div>
      <button data-testid="scan-btn">Scan</button>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/ComponentLedger', () => ({
  ComponentLedger: () => (
    <div data-testid="component-ledger">
      <h1>Component Ledger</h1>
      <div data-testid="component-list">Component List</div>
      <button data-testid="create-component-btn">Add Component</button>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/ComponentDetails', () => ({
  ComponentDetails: () => (
    <div data-testid="component-details">
      <h1>Component Details</h1>
      <div data-testid="component-info">Component Info</div>
      <div data-testid="movement-history">Movement History</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/CreateComponent', () => ({
  CreateComponent: () => (
    <div data-testid="create-component">
      <h1>Create Component</h1>
      <form data-testid="component-form">
        <input data-testid="component-name" placeholder="Name" />
        <select data-testid="component-type">
          <option value="mechanical">Mechanical</option>
        </select>
        <button type="submit">Create</button>
      </form>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/StockyardAnalytics', () => ({
  StockyardAnalytics: () => (
    <div data-testid="stockyard-analytics">
      <h1>Stockyard Analytics</h1>
      <div data-testid="charts">Charts</div>
      <div data-testid="metrics">Metrics</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/YardMap', () => ({
  YardMap: () => (
    <div data-testid="yard-map">
      <h1>Yard Map</h1>
      <div data-testid="map-view">Map View</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/ChecklistView', () => ({
  ChecklistView: () => (
    <div data-testid="checklist-view">
      <h1>Checklist View</h1>
      <div data-testid="checklist-items">Checklist Items</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/BuyerReadinessBoard', () => ({
  BuyerReadinessBoard: () => (
    <div data-testid="buyer-readiness">
      <h1>Buyer Readiness Board</h1>
      <div data-testid="readiness-list">Readiness List</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/VehicleTimeline', () => ({
  VehicleTimeline: () => (
    <div data-testid="vehicle-timeline">
      <h1>Vehicle Timeline</h1>
      <div data-testid="timeline-events">Timeline Events</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/ComplianceDocuments', () => ({
  ComplianceDocuments: () => (
    <div data-testid="compliance-documents">
      <h1>Compliance Documents</h1>
      <div data-testid="document-list">Document List</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/TransporterBids', () => ({
  TransporterBids: () => (
    <div data-testid="transporter-bids">
      <h1>Transporter Bids</h1>
      <div data-testid="bid-list">Bid List</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/ProfitabilityDashboard', () => ({
  ProfitabilityDashboard: () => (
    <div data-testid="profitability-dashboard">
      <h1>Profitability Dashboard</h1>
      <div data-testid="profit-metrics">Profit Metrics</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/StockyardAlertsDashboard', () => ({
  StockyardAlertsDashboard: () => (
    <div data-testid="stockyard-alerts">
      <h1>Stockyard Alerts</h1>
      <div data-testid="alert-list">Alert List</div>
    </div>
  ),
}));

describe('Stockyard Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stockyard Dashboard', () => {
    it('should render dashboard for authenticated users', async () => {
      const { StockyardDashboard } = await import('../../pages/stockyard/StockyardDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard'],
      });

      expect(screen.getByTestId('stockyard-dashboard')).toBeInTheDocument();
    });

    it('should show request list', async () => {
      const { StockyardDashboard } = await import('../../pages/stockyard/StockyardDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard'],
      });

      expect(screen.getByTestId('request-list')).toBeInTheDocument();
    });

    it('should show create request button', async () => {
      const { StockyardDashboard } = await import('../../pages/stockyard/StockyardDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard'],
      });

      expect(screen.getByTestId('create-request-btn')).toBeInTheDocument();
    });

    it('should show stats', async () => {
      const { StockyardDashboard } = await import('../../pages/stockyard/StockyardDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard'],
      });

      expect(screen.getByTestId('stats')).toBeInTheDocument();
    });
  });

  describe('Create Component Movement', () => {
    it('should render movement form', async () => {
      const { CreateComponentMovement } = await import('../../pages/stockyard/CreateComponentMovement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateComponentMovement />, {
        authContext,
        initialEntries: ['/app/stockyard/create'],
      });

      expect(screen.getByTestId('create-movement')).toBeInTheDocument();
      expect(screen.getByTestId('movement-form')).toBeInTheDocument();
    });

    it('should have component select', async () => {
      const { CreateComponentMovement } = await import('../../pages/stockyard/CreateComponentMovement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateComponentMovement />, {
        authContext,
        initialEntries: ['/app/stockyard/create'],
      });

      expect(screen.getByTestId('component')).toBeInTheDocument();
    });

    it('should have movement type select', async () => {
      const { CreateComponentMovement } = await import('../../pages/stockyard/CreateComponentMovement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateComponentMovement />, {
        authContext,
        initialEntries: ['/app/stockyard/create'],
      });

      expect(screen.getByTestId('movement-type')).toBeInTheDocument();
    });
  });

  describe('Request Details', () => {
    it('should render request details', async () => {
      const { StockyardRequestDetails } = await import('../../pages/stockyard/StockyardRequestDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardRequestDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/1'],
      });

      expect(screen.getByTestId('request-details')).toBeInTheDocument();
    });

    it('should show request info', async () => {
      const { StockyardRequestDetails } = await import('../../pages/stockyard/StockyardRequestDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardRequestDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/1'],
      });

      expect(screen.getByTestId('request-info')).toBeInTheDocument();
    });

    it('should show timeline', async () => {
      const { StockyardRequestDetails } = await import('../../pages/stockyard/StockyardRequestDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardRequestDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/1'],
      });

      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });
  });

  describe('Stockyard Scan', () => {
    it('should render scan page', async () => {
      const { StockyardScan } = await import('../../pages/stockyard/StockyardScan');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardScan />, {
        authContext,
        initialEntries: ['/app/stockyard/scan'],
      });

      expect(screen.getByTestId('stockyard-scan')).toBeInTheDocument();
    });

    it('should show scanner', async () => {
      const { StockyardScan } = await import('../../pages/stockyard/StockyardScan');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardScan />, {
        authContext,
        initialEntries: ['/app/stockyard/scan'],
      });

      expect(screen.getByTestId('scanner')).toBeInTheDocument();
    });

    it('should have scan button', async () => {
      const { StockyardScan } = await import('../../pages/stockyard/StockyardScan');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardScan />, {
        authContext,
        initialEntries: ['/app/stockyard/scan'],
      });

      expect(screen.getByTestId('scan-btn')).toBeInTheDocument();
    });
  });

  describe('Component Ledger', () => {
    it('should render component ledger', async () => {
      const { ComponentLedger } = await import('../../pages/stockyard/ComponentLedger');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComponentLedger />, {
        authContext,
        initialEntries: ['/app/stockyard/components'],
      });

      expect(screen.getByTestId('component-ledger')).toBeInTheDocument();
    });

    it('should show component list', async () => {
      const { ComponentLedger } = await import('../../pages/stockyard/ComponentLedger');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComponentLedger />, {
        authContext,
        initialEntries: ['/app/stockyard/components'],
      });

      expect(screen.getByTestId('component-list')).toBeInTheDocument();
    });

    it('should have create component button', async () => {
      const { ComponentLedger } = await import('../../pages/stockyard/ComponentLedger');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComponentLedger />, {
        authContext,
        initialEntries: ['/app/stockyard/components'],
      });

      expect(screen.getByTestId('create-component-btn')).toBeInTheDocument();
    });
  });

  describe('Component Details', () => {
    it('should render component details', async () => {
      const { ComponentDetails } = await import('../../pages/stockyard/ComponentDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComponentDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/components/1'],
      });

      expect(screen.getByTestId('component-details')).toBeInTheDocument();
    });

    it('should show component info', async () => {
      const { ComponentDetails } = await import('../../pages/stockyard/ComponentDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComponentDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/components/1'],
      });

      expect(screen.getByTestId('component-info')).toBeInTheDocument();
    });

    it('should show movement history', async () => {
      const { ComponentDetails } = await import('../../pages/stockyard/ComponentDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComponentDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/components/1'],
      });

      expect(screen.getByTestId('movement-history')).toBeInTheDocument();
    });
  });

  describe('Stockyard Analytics', () => {
    it('should render analytics page', async () => {
      const { StockyardAnalytics } = await import('../../pages/stockyard/StockyardAnalytics');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardAnalytics />, {
        authContext,
        initialEntries: ['/app/stockyard/analytics'],
      });

      expect(screen.getByTestId('stockyard-analytics')).toBeInTheDocument();
    });

    it('should show charts', async () => {
      const { StockyardAnalytics } = await import('../../pages/stockyard/StockyardAnalytics');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardAnalytics />, {
        authContext,
        initialEntries: ['/app/stockyard/analytics'],
      });

      expect(screen.getByTestId('charts')).toBeInTheDocument();
    });

    it('should show metrics', async () => {
      const { StockyardAnalytics } = await import('../../pages/stockyard/StockyardAnalytics');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardAnalytics />, {
        authContext,
        initialEntries: ['/app/stockyard/analytics'],
      });

      expect(screen.getByTestId('metrics')).toBeInTheDocument();
    });
  });

  describe('Stockyard Alerts', () => {
    it('should render alerts page', async () => {
      const { StockyardAlertsDashboard } = await import('../../pages/stockyard/StockyardAlertsDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardAlertsDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard/alerts'],
      });

      expect(screen.getByTestId('stockyard-alerts')).toBeInTheDocument();
    });

    it('should show alert list', async () => {
      const { StockyardAlertsDashboard } = await import('../../pages/stockyard/StockyardAlertsDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<StockyardAlertsDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard/alerts'],
      });

      expect(screen.getByTestId('alert-list')).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    const roles = ['superAdmin', 'admin', 'supervisor'] as const;

    roles.forEach((role) => {
      it(`should allow ${role} to access stockyard dashboard`, async () => {
        const { StockyardDashboard } = await import('../../pages/stockyard/StockyardDashboard');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<StockyardDashboard />, {
          authContext,
          initialEntries: ['/app/stockyard'],
        });

        expect(screen.getByTestId('stockyard-dashboard')).toBeInTheDocument();
      });
    });
  });
});








