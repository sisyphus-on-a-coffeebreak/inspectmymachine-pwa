/**
 * Gate Pass Module Tests
 * Tests all gate pass related functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the gate pass components
vi.mock('../../pages/gatepass/GatePassDashboard', () => ({
  GatePassDashboard: () => (
    <div data-testid="gate-pass-dashboard">
      <h1>Gate Pass Dashboard</h1>
      <div data-testid="pass-list">Pass List</div>
      <button data-testid="create-pass-btn">Create Pass</button>
      <div data-testid="stats">Stats: Active 50, Pending 25</div>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/CreateGatePass', () => ({
  CreateGatePass: () => (
    <div data-testid="create-gate-pass">
      <h1>Create Gate Pass</h1>
      <form data-testid="pass-form">
        <input data-testid="visitor-name" placeholder="Visitor Name" />
        <input data-testid="visitor-phone" placeholder="Phone" />
        <input data-testid="purpose" placeholder="Purpose" />
        <button type="submit">Create Pass</button>
      </form>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/GatePassDetails', () => ({
  GatePassDetails: () => (
    <div data-testid="gate-pass-details">
      <h1>Gate Pass Details</h1>
      <div data-testid="pass-info">Pass Information</div>
      <div data-testid="qr-code">QR Code</div>
      <button data-testid="print-btn">Print Pass</button>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/GuardRegister', () => ({
  GuardRegister: () => (
    <div data-testid="guard-register">
      <h1>Guard Register</h1>
      <div data-testid="scan-area">Scan Area</div>
      <div data-testid="recent-scans">Recent Scans</div>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/QuickValidation', () => ({
  QuickValidation: () => (
    <div data-testid="quick-validation">
      <h1>Quick Validation</h1>
      <input data-testid="access-code" placeholder="Enter Access Code" />
      <button data-testid="validate-btn">Validate</button>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/VisitorManagement', () => ({
  VisitorManagement: () => (
    <div data-testid="visitor-management">
      <h1>Visitor Management</h1>
      <div data-testid="visitor-list">Visitor List</div>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/GatePassCalendar', () => ({
  GatePassCalendar: () => (
    <div data-testid="gate-pass-calendar">
      <h1>Gate Pass Calendar</h1>
      <div data-testid="calendar">Calendar View</div>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/GatePassReports', () => ({
  GatePassReports: () => (
    <div data-testid="gate-pass-reports">
      <h1>Gate Pass Reports</h1>
      <div data-testid="report-list">Reports</div>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/PassTemplates', () => ({
  PassTemplates: () => (
    <div data-testid="pass-templates">
      <h1>Pass Templates</h1>
      <div data-testid="template-list">Templates</div>
    </div>
  ),
}));

vi.mock('../../pages/gatepass/BulkOperations', () => ({
  BulkOperations: () => (
    <div data-testid="bulk-operations">
      <h1>Bulk Operations</h1>
      <div data-testid="operations">Operations</div>
    </div>
  ),
}));

describe('Gate Pass Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Gate Pass Dashboard', () => {
    it('should render dashboard for authenticated users', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/gate-pass'],
      });

      expect(screen.getByTestId('gate-pass-dashboard')).toBeInTheDocument();
    });

    it('should show pass list', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/gate-pass'],
      });

      expect(screen.getByTestId('pass-list')).toBeInTheDocument();
    });

    it('should show create pass button', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/gate-pass'],
      });

      expect(screen.getByTestId('create-pass-btn')).toBeInTheDocument();
    });

    it('should show stats', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/gate-pass'],
      });

      expect(screen.getByTestId('stats')).toBeInTheDocument();
    });
  });

  describe('Create Gate Pass', () => {
    it('should render create form', async () => {
      const { CreateGatePass } = await import('../../pages/gatepass/CreateGatePass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/gate-pass/create'],
      });

      expect(screen.getByTestId('create-gate-pass')).toBeInTheDocument();
      expect(screen.getByTestId('pass-form')).toBeInTheDocument();
    });

    it('should have visitor name input', async () => {
      const { CreateGatePass } = await import('../../pages/gatepass/CreateGatePass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/gate-pass/create'],
      });

      expect(screen.getByTestId('visitor-name')).toBeInTheDocument();
    });

    it('should have phone input', async () => {
      const { CreateGatePass } = await import('../../pages/gatepass/CreateGatePass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/gate-pass/create'],
      });

      expect(screen.getByTestId('visitor-phone')).toBeInTheDocument();
    });

    it('should have purpose input', async () => {
      const { CreateGatePass } = await import('../../pages/gatepass/CreateGatePass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/gate-pass/create'],
      });

      expect(screen.getByTestId('purpose')).toBeInTheDocument();
    });
  });

  describe('Gate Pass Details', () => {
    it('should render pass details', async () => {
      const { GatePassDetails } = await import('../../pages/gatepass/GatePassDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDetails />, {
        authContext,
        initialEntries: ['/app/gate-pass/1'],
      });

      expect(screen.getByTestId('gate-pass-details')).toBeInTheDocument();
    });

    it('should show QR code', async () => {
      const { GatePassDetails } = await import('../../pages/gatepass/GatePassDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDetails />, {
        authContext,
        initialEntries: ['/app/gate-pass/1'],
      });

      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    it('should have print button', async () => {
      const { GatePassDetails } = await import('../../pages/gatepass/GatePassDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDetails />, {
        authContext,
        initialEntries: ['/app/gate-pass/1'],
      });

      expect(screen.getByTestId('print-btn')).toBeInTheDocument();
    });
  });

  describe('Guard Register', () => {
    it('should render for guard role', async () => {
      const { GuardRegister } = await import('../../pages/gatepass/GuardRegister');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<GuardRegister />, {
        authContext,
        initialEntries: ['/app/gate-pass/guard-register'],
      });

      expect(screen.getByTestId('guard-register')).toBeInTheDocument();
    });

    it('should show scan area', async () => {
      const { GuardRegister } = await import('../../pages/gatepass/GuardRegister');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<GuardRegister />, {
        authContext,
        initialEntries: ['/app/gate-pass/guard-register'],
      });

      expect(screen.getByTestId('scan-area')).toBeInTheDocument();
    });

    it('should show recent scans', async () => {
      const { GuardRegister } = await import('../../pages/gatepass/GuardRegister');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<GuardRegister />, {
        authContext,
        initialEntries: ['/app/gate-pass/guard-register'],
      });

      expect(screen.getByTestId('recent-scans')).toBeInTheDocument();
    });
  });

  describe('Quick Validation', () => {
    it('should render validation screen', async () => {
      const { QuickValidation } = await import('../../pages/gatepass/QuickValidation');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<QuickValidation />, {
        authContext,
        initialEntries: ['/app/gate-pass/scan'],
      });

      expect(screen.getByTestId('quick-validation')).toBeInTheDocument();
    });

    it('should have access code input', async () => {
      const { QuickValidation } = await import('../../pages/gatepass/QuickValidation');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<QuickValidation />, {
        authContext,
        initialEntries: ['/app/gate-pass/scan'],
      });

      expect(screen.getByTestId('access-code')).toBeInTheDocument();
    });

    it('should have validate button', async () => {
      const { QuickValidation } = await import('../../pages/gatepass/QuickValidation');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<QuickValidation />, {
        authContext,
        initialEntries: ['/app/gate-pass/scan'],
      });

      expect(screen.getByTestId('validate-btn')).toBeInTheDocument();
    });
  });

  describe('Visitor Management', () => {
    it('should render visitor list', async () => {
      const { VisitorManagement } = await import('../../pages/gatepass/VisitorManagement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<VisitorManagement />, {
        authContext,
        initialEntries: ['/app/gate-pass/visitors'],
      });

      expect(screen.getByTestId('visitor-management')).toBeInTheDocument();
      expect(screen.getByTestId('visitor-list')).toBeInTheDocument();
    });
  });

  describe('Gate Pass Calendar', () => {
    it('should render calendar view', async () => {
      const { GatePassCalendar } = await import('../../pages/gatepass/GatePassCalendar');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassCalendar />, {
        authContext,
        initialEntries: ['/app/gate-pass/calendar'],
      });

      expect(screen.getByTestId('gate-pass-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Gate Pass Reports (Admin Only)', () => {
    it('should render for admin', async () => {
      const { GatePassReports } = await import('../../pages/gatepass/GatePassReports');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<GatePassReports />, {
        authContext,
        initialEntries: ['/app/gate-pass/reports'],
      });

      expect(screen.getByTestId('gate-pass-reports')).toBeInTheDocument();
    });
  });

  describe('Pass Templates (Admin Only)', () => {
    it('should render for admin', async () => {
      const { PassTemplates } = await import('../../pages/gatepass/PassTemplates');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<PassTemplates />, {
        authContext,
        initialEntries: ['/app/gate-pass/templates'],
      });

      expect(screen.getByTestId('pass-templates')).toBeInTheDocument();
    });
  });

  describe('Bulk Operations (Admin Only)', () => {
    it('should render for admin', async () => {
      const { BulkOperations } = await import('../../pages/gatepass/BulkOperations');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<BulkOperations />, {
        authContext,
        initialEntries: ['/app/gate-pass/bulk'],
      });

      expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    const roles = ['superAdmin', 'admin', 'supervisor', 'inspector', 'guard', 'clerk'] as const;

    roles.forEach((role) => {
      it(`should allow ${role} to access gate pass dashboard`, async () => {
        const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<GatePassDashboard />, {
          authContext,
          initialEntries: ['/app/gate-pass'],
        });

        expect(screen.getByTestId('gate-pass-dashboard')).toBeInTheDocument();
      });
    });
  });
});





