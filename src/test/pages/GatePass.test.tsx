/**
 * Access Pass Module Tests (formerly Gate Pass)
 * Tests all access pass related functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the access pass components
vi.mock('../../pages/stockyard/access/AccessDashboard', () => ({
  AccessDashboard: () => (
    <div data-testid="access-dashboard">
      <h1>Access Dashboard</h1>
      <div data-testid="pass-list">Pass List</div>
      <button data-testid="create-pass-btn">Create Pass</button>
      <div data-testid="stats">Stats: Active 50, Pending 25</div>
    </div>
  ),
}));

vi.mock('../../pages/stockyard/access/CreateAccessPass', () => ({
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

// All mocks have been updated to use stockyard/access paths in the describe blocks

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
        initialEntries: ['/app/stockyard/access'],
      });

      expect(screen.getByTestId('gate-pass-dashboard')).toBeInTheDocument();
    });

    it('should show pass list', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard/access'],
      });

      expect(screen.getByTestId('pass-list')).toBeInTheDocument();
    });

    it('should show create pass button', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard/access'],
      });

      expect(screen.getByTestId('create-pass-btn')).toBeInTheDocument();
    });

    it('should show stats', async () => {
      const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<GatePassDashboard />, {
        authContext,
        initialEntries: ['/app/stockyard/access'],
      });

      expect(screen.getByTestId('stats')).toBeInTheDocument();
    });
  });

  describe('Create Gate Pass', () => {
    it('should render create form', async () => {
      const { CreateAccessPass } = await import('../../pages/stockyard/access/CreateAccessPass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/stockyard/access/create'],
      });

      expect(screen.getByTestId('create-gate-pass')).toBeInTheDocument();
      expect(screen.getByTestId('pass-form')).toBeInTheDocument();
    });

    it('should have visitor name input', async () => {
      const { CreateAccessPass } = await import('../../pages/stockyard/access/CreateAccessPass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/stockyard/access/create'],
      });

      expect(screen.getByTestId('visitor-name')).toBeInTheDocument();
    });

    it('should have phone input', async () => {
      const { CreateAccessPass } = await import('../../pages/stockyard/access/CreateAccessPass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/stockyard/access/create'],
      });

      expect(screen.getByTestId('visitor-phone')).toBeInTheDocument();
    });

    it('should have purpose input', async () => {
      const { CreateAccessPass } = await import('../../pages/stockyard/access/CreateAccessPass');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateGatePass />, {
        authContext,
        initialEntries: ['/app/stockyard/access/create'],
      });

      expect(screen.getByTestId('purpose')).toBeInTheDocument();
    });
  });

  describe('Gate Pass Details', () => {
    it('should render pass details', async () => {
      const { AccessPassDetails } = await import('../../pages/stockyard/access/AccessPassDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
        renderWithProviders(<AccessPassDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/access/1'],
      });

        expect(screen.getByTestId('access-pass-details')).toBeInTheDocument();
    });

    it('should show QR code', async () => {
      const { AccessPassDetails } = await import('../../pages/stockyard/access/AccessPassDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
        renderWithProviders(<AccessPassDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/access/1'],
      });

      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    it('should have print button', async () => {
      const { AccessPassDetails } = await import('../../pages/stockyard/access/AccessPassDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
        renderWithProviders(<AccessPassDetails />, {
        authContext,
        initialEntries: ['/app/stockyard/access/1'],
      });

      expect(screen.getByTestId('print-btn')).toBeInTheDocument();
    });
  });

  describe('Guard Register', () => {
    it('should render for guard role', async () => {
      const { GuardRegister } = await import('../../pages/stockyard/access/GuardRegister');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<GuardRegister />, {
        authContext,
        initialEntries: ['/app/stockyard/access/guard-register'],
      });

      expect(screen.getByTestId('guard-register')).toBeInTheDocument();
    });

    it('should show scan area', async () => {
      const { GuardRegister } = await import('../../pages/stockyard/access/GuardRegister');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<GuardRegister />, {
        authContext,
        initialEntries: ['/app/stockyard/access/guard-register'],
      });

      expect(screen.getByTestId('scan-area')).toBeInTheDocument();
    });

    it('should show recent scans', async () => {
      const { GuardRegister } = await import('../../pages/stockyard/access/GuardRegister');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<GuardRegister />, {
        authContext,
        initialEntries: ['/app/stockyard/access/guard-register'],
      });

      expect(screen.getByTestId('recent-scans')).toBeInTheDocument();
    });
  });

  describe('Quick Validation', () => {
    it('should render validation screen', async () => {
      const { QuickValidation } = await import('../../pages/stockyard/access/QuickValidation');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<QuickValidation />, {
        authContext,
        initialEntries: ['/app/stockyard/access/scan'],
      });

      expect(screen.getByTestId('quick-validation')).toBeInTheDocument();
    });

    it('should have access code input', async () => {
      const { QuickValidation } = await import('../../pages/stockyard/access/QuickValidation');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<QuickValidation />, {
        authContext,
        initialEntries: ['/app/stockyard/access/scan'],
      });

      expect(screen.getByTestId('access-code')).toBeInTheDocument();
    });

    it('should have validate button', async () => {
      const { QuickValidation } = await import('../../pages/stockyard/access/QuickValidation');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<QuickValidation />, {
        authContext,
        initialEntries: ['/app/stockyard/access/scan'],
      });

      expect(screen.getByTestId('validate-btn')).toBeInTheDocument();
    });
  });

  describe('Visitor Management', () => {
    it('should render visitor list', async () => {
      const { VisitorManagement } = await import('../../pages/stockyard/access/VisitorManagement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<VisitorManagement />, {
        authContext,
        initialEntries: ['/app/stockyard/access/visitors'],
      });

      expect(screen.getByTestId('visitor-management')).toBeInTheDocument();
      expect(screen.getByTestId('visitor-list')).toBeInTheDocument();
    });
  });

  describe('Gate Pass Calendar', () => {
    it('should render calendar view', async () => {
      const { AccessCalendar } = await import('../../pages/stockyard/access/AccessCalendar');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
        renderWithProviders(<AccessCalendar />, {
        authContext,
        initialEntries: ['/app/stockyard/access/calendar'],
      });

        expect(screen.getByTestId('access-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Gate Pass Reports (Admin Only)', () => {
    it('should render for admin', async () => {
      const { AccessReports } = await import('../../pages/stockyard/access/AccessReports');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
        renderWithProviders(<AccessReports />, {
        authContext,
        initialEntries: ['/app/stockyard/access/reports'],
      });

        expect(screen.getByTestId('access-reports')).toBeInTheDocument();
    });
  });

  describe('Pass Templates (Admin Only)', () => {
    it('should render for admin', async () => {
      const { PassTemplates } = await import('../../pages/stockyard/access/PassTemplates');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<PassTemplates />, {
        authContext,
        initialEntries: ['/app/stockyard/access/templates'],
      });

      expect(screen.getByTestId('pass-templates')).toBeInTheDocument();
    });
  });

  describe('Bulk Operations (Admin Only)', () => {
    it('should render for admin', async () => {
      const { BulkAccessOperations } = await import('../../pages/stockyard/access/BulkAccessOperations');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
        renderWithProviders(<BulkAccessOperations />, {
        authContext,
        initialEntries: ['/app/stockyard/access/bulk'],
      });

      expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    const roles = ['superAdmin', 'admin', 'supervisor', 'inspector', 'guard', 'clerk'] as const;

    roles.forEach((role) => {
      it(`should allow ${role} to access access dashboard`, async () => {
        const { GatePassDashboard } = await import('../../pages/gatepass/GatePassDashboard');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<AccessDashboard />, {
          authContext,
          initialEntries: ['/app/stockyard/access'],
        });

        expect(screen.getByTestId('access-dashboard')).toBeInTheDocument();
      });
    });
  });
});






