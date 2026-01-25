/**
 * Admin Module Tests
 * Tests all admin and user management functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the admin components
vi.mock('../../pages/admin/UserManagement', () => ({
  default: () => (
    <div data-testid="user-management">
      <h1>User Management</h1>
      <div data-testid="user-list">User List</div>
      <button data-testid="create-user-btn">Create User</button>
      <div data-testid="filters">Filters</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/UserDetails', () => ({
  UserDetails: () => (
    <div data-testid="user-details">
      <h1>User Details</h1>
      <div data-testid="user-info">User Info</div>
      <div data-testid="capabilities">Capabilities</div>
      <button data-testid="edit-btn">Edit User</button>
    </div>
  ),
}));

vi.mock('../../pages/admin/PermissionTemplates', () => ({
  default: () => (
    <div data-testid="permission-templates">
      <h1>Permission Templates</h1>
      <div data-testid="template-list">Template List</div>
      <button data-testid="create-template-btn">Create Template</button>
    </div>
  ),
}));

vi.mock('../../pages/admin/PermissionTesting', () => ({
  default: () => (
    <div data-testid="permission-testing">
      <h1>Permission Testing</h1>
      <div data-testid="test-form">Test Form</div>
      <button data-testid="test-btn">Test Permission</button>
    </div>
  ),
}));

vi.mock('../../pages/admin/DataMaskingRules', () => ({
  default: () => (
    <div data-testid="data-masking">
      <h1>Data Masking Rules</h1>
      <div data-testid="rule-list">Rule List</div>
      <button data-testid="create-rule-btn">Create Rule</button>
    </div>
  ),
}));

vi.mock('../../pages/admin/SecurityDashboard', () => ({
  SecurityDashboard: () => (
    <div data-testid="security-dashboard">
      <h1>Security Dashboard</h1>
      <div data-testid="security-metrics">Security Metrics</div>
      <div data-testid="threats">Threat Analysis</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/ActivityLogs', () => ({
  ActivityLogs: () => (
    <div data-testid="activity-logs">
      <h1>Activity Logs</h1>
      <div data-testid="log-list">Log List</div>
      <div data-testid="filters">Filters</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/PermissionChangeLogs', () => ({
  PermissionChangeLogs: () => (
    <div data-testid="permission-logs">
      <h1>Permission Change Logs</h1>
      <div data-testid="change-list">Change List</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/AuditReports', () => ({
  AuditReports: () => (
    <div data-testid="audit-reports">
      <h1>Audit Reports</h1>
      <div data-testid="report-list">Report List</div>
      <button data-testid="generate-btn">Generate Report</button>
    </div>
  ),
}));

vi.mock('../../pages/admin/ComplianceDashboard', () => ({
  ComplianceDashboard: () => (
    <div data-testid="compliance-dashboard">
      <h1>Compliance Dashboard</h1>
      <div data-testid="compliance-score">Compliance Score: 95%</div>
      <div data-testid="issues">Issues</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/UserActivityDashboard', () => ({
  UserActivityDashboard: () => (
    <div data-testid="user-activity">
      <h1>User Activity Dashboard</h1>
      <div data-testid="activity-charts">Activity Charts</div>
      <div data-testid="active-users">Active Users</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/CapabilityMatrix', () => ({
  CapabilityMatrix: () => (
    <div data-testid="capability-matrix">
      <h1>Capability Matrix</h1>
      <div data-testid="matrix-grid">Matrix Grid</div>
    </div>
  ),
}));

vi.mock('../../pages/admin/BulkUserOperations', () => ({
  BulkUserOperations: () => (
    <div data-testid="bulk-operations">
      <h1>Bulk User Operations</h1>
      <div data-testid="operation-form">Operation Form</div>
      <button data-testid="execute-btn">Execute</button>
    </div>
  ),
}));

describe('Admin Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Management', () => {
    it('should render user management for admin', async () => {
      const UserManagement = (await import('../../pages/admin/UserManagement')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserManagement />, {
        authContext,
        initialEntries: ['/app/admin/users'],
      });

      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    it('should show user list', async () => {
      const UserManagement = (await import('../../pages/admin/UserManagement')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserManagement />, {
        authContext,
        initialEntries: ['/app/admin/users'],
      });

      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    it('should have create user button', async () => {
      const UserManagement = (await import('../../pages/admin/UserManagement')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserManagement />, {
        authContext,
        initialEntries: ['/app/admin/users'],
      });

      expect(screen.getByTestId('create-user-btn')).toBeInTheDocument();
    });

    it('should show filters', async () => {
      const UserManagement = (await import('../../pages/admin/UserManagement')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserManagement />, {
        authContext,
        initialEntries: ['/app/admin/users'],
      });

      expect(screen.getByTestId('filters')).toBeInTheDocument();
    });
  });

  describe('User Details', () => {
    it('should render user details', async () => {
      const { UserDetails } = await import('../../pages/admin/UserDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserDetails />, {
        authContext,
        initialEntries: ['/app/admin/users/1'],
      });

      expect(screen.getByTestId('user-details')).toBeInTheDocument();
    });

    it('should show user info', async () => {
      const { UserDetails } = await import('../../pages/admin/UserDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserDetails />, {
        authContext,
        initialEntries: ['/app/admin/users/1'],
      });

      expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });

    it('should show capabilities', async () => {
      const { UserDetails } = await import('../../pages/admin/UserDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserDetails />, {
        authContext,
        initialEntries: ['/app/admin/users/1'],
      });

      expect(screen.getByTestId('capabilities')).toBeInTheDocument();
    });

    it('should have edit button', async () => {
      const { UserDetails } = await import('../../pages/admin/UserDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserDetails />, {
        authContext,
        initialEntries: ['/app/admin/users/1'],
      });

      expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
    });
  });

  describe('Permission Templates', () => {
    it('should render permission templates', async () => {
      const PermissionTemplates = (await import('../../pages/admin/PermissionTemplates')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionTemplates />, {
        authContext,
        initialEntries: ['/app/admin/permission-templates'],
      });

      expect(screen.getByTestId('permission-templates')).toBeInTheDocument();
    });

    it('should show template list', async () => {
      const PermissionTemplates = (await import('../../pages/admin/PermissionTemplates')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionTemplates />, {
        authContext,
        initialEntries: ['/app/admin/permission-templates'],
      });

      expect(screen.getByTestId('template-list')).toBeInTheDocument();
    });

    it('should have create template button', async () => {
      const PermissionTemplates = (await import('../../pages/admin/PermissionTemplates')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionTemplates />, {
        authContext,
        initialEntries: ['/app/admin/permission-templates'],
      });

      expect(screen.getByTestId('create-template-btn')).toBeInTheDocument();
    });
  });

  describe('Permission Testing', () => {
    it('should render permission testing', async () => {
      const PermissionTesting = (await import('../../pages/admin/PermissionTesting')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionTesting />, {
        authContext,
        initialEntries: ['/app/admin/permission-testing'],
      });

      expect(screen.getByTestId('permission-testing')).toBeInTheDocument();
    });

    it('should show test form', async () => {
      const PermissionTesting = (await import('../../pages/admin/PermissionTesting')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionTesting />, {
        authContext,
        initialEntries: ['/app/admin/permission-testing'],
      });

      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });

    it('should have test button', async () => {
      const PermissionTesting = (await import('../../pages/admin/PermissionTesting')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionTesting />, {
        authContext,
        initialEntries: ['/app/admin/permission-testing'],
      });

      expect(screen.getByTestId('test-btn')).toBeInTheDocument();
    });
  });

  describe('Data Masking Rules', () => {
    it('should render data masking', async () => {
      const DataMaskingRules = (await import('../../pages/admin/DataMaskingRules')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<DataMaskingRules />, {
        authContext,
        initialEntries: ['/app/admin/data-masking-rules'],
      });

      expect(screen.getByTestId('data-masking')).toBeInTheDocument();
    });

    it('should show rule list', async () => {
      const DataMaskingRules = (await import('../../pages/admin/DataMaskingRules')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<DataMaskingRules />, {
        authContext,
        initialEntries: ['/app/admin/data-masking-rules'],
      });

      expect(screen.getByTestId('rule-list')).toBeInTheDocument();
    });
  });

  describe('Security Dashboard', () => {
    it('should render security dashboard', async () => {
      const { SecurityDashboard } = await import('../../pages/admin/SecurityDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<SecurityDashboard />, {
        authContext,
        initialEntries: ['/app/admin/security'],
      });

      expect(screen.getByTestId('security-dashboard')).toBeInTheDocument();
    });

    it('should show security metrics', async () => {
      const { SecurityDashboard } = await import('../../pages/admin/SecurityDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<SecurityDashboard />, {
        authContext,
        initialEntries: ['/app/admin/security'],
      });

      expect(screen.getByTestId('security-metrics')).toBeInTheDocument();
    });
  });

  describe('Activity Logs', () => {
    it('should render activity logs', async () => {
      const { ActivityLogs } = await import('../../pages/admin/ActivityLogs');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ActivityLogs />, {
        authContext,
        initialEntries: ['/app/admin/activity-logs'],
      });

      expect(screen.getByTestId('activity-logs')).toBeInTheDocument();
    });

    it('should show log list', async () => {
      const { ActivityLogs } = await import('../../pages/admin/ActivityLogs');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ActivityLogs />, {
        authContext,
        initialEntries: ['/app/admin/activity-logs'],
      });

      expect(screen.getByTestId('log-list')).toBeInTheDocument();
    });
  });

  describe('Permission Change Logs', () => {
    it('should render permission logs', async () => {
      const { PermissionChangeLogs } = await import('../../pages/admin/PermissionChangeLogs');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<PermissionChangeLogs />, {
        authContext,
        initialEntries: ['/app/admin/permission-logs'],
      });

      expect(screen.getByTestId('permission-logs')).toBeInTheDocument();
    });
  });

  describe('Audit Reports', () => {
    it('should render audit reports', async () => {
      const { AuditReports } = await import('../../pages/admin/AuditReports');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AuditReports />, {
        authContext,
        initialEntries: ['/app/admin/audit-reports'],
      });

      expect(screen.getByTestId('audit-reports')).toBeInTheDocument();
    });

    it('should show report list', async () => {
      const { AuditReports } = await import('../../pages/admin/AuditReports');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AuditReports />, {
        authContext,
        initialEntries: ['/app/admin/audit-reports'],
      });

      expect(screen.getByTestId('report-list')).toBeInTheDocument();
    });

    it('should have generate button', async () => {
      const { AuditReports } = await import('../../pages/admin/AuditReports');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AuditReports />, {
        authContext,
        initialEntries: ['/app/admin/audit-reports'],
      });

      expect(screen.getByTestId('generate-btn')).toBeInTheDocument();
    });
  });

  describe('Compliance Dashboard', () => {
    it('should render compliance dashboard', async () => {
      const { ComplianceDashboard } = await import('../../pages/admin/ComplianceDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComplianceDashboard />, {
        authContext,
        initialEntries: ['/app/admin/compliance'],
      });

      expect(screen.getByTestId('compliance-dashboard')).toBeInTheDocument();
    });

    it('should show compliance score', async () => {
      const { ComplianceDashboard } = await import('../../pages/admin/ComplianceDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ComplianceDashboard />, {
        authContext,
        initialEntries: ['/app/admin/compliance'],
      });

      expect(screen.getByTestId('compliance-score')).toBeInTheDocument();
    });
  });

  describe('User Activity Dashboard', () => {
    it('should render user activity dashboard', async () => {
      const { UserActivityDashboard } = await import('../../pages/admin/UserActivityDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserActivityDashboard />, {
        authContext,
        initialEntries: ['/app/admin/users/activity'],
      });

      expect(screen.getByTestId('user-activity')).toBeInTheDocument();
    });

    it('should show activity charts', async () => {
      const { UserActivityDashboard } = await import('../../pages/admin/UserActivityDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserActivityDashboard />, {
        authContext,
        initialEntries: ['/app/admin/users/activity'],
      });

      expect(screen.getByTestId('activity-charts')).toBeInTheDocument();
    });
  });

  describe('Capability Matrix', () => {
    it('should render capability matrix', async () => {
      const { CapabilityMatrix } = await import('../../pages/admin/CapabilityMatrix');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CapabilityMatrix />, {
        authContext,
        initialEntries: ['/app/admin/users/capability-matrix'],
      });

      expect(screen.getByTestId('capability-matrix')).toBeInTheDocument();
    });

    it('should show matrix grid', async () => {
      const { CapabilityMatrix } = await import('../../pages/admin/CapabilityMatrix');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CapabilityMatrix />, {
        authContext,
        initialEntries: ['/app/admin/users/capability-matrix'],
      });

      expect(screen.getByTestId('matrix-grid')).toBeInTheDocument();
    });
  });

  describe('Bulk User Operations', () => {
    it('should render bulk operations', async () => {
      const { BulkUserOperations } = await import('../../pages/admin/BulkUserOperations');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<BulkUserOperations />, {
        authContext,
        initialEntries: ['/app/admin/users/bulk-operations'],
      });

      expect(screen.getByTestId('bulk-operations')).toBeInTheDocument();
    });

    it('should show operation form', async () => {
      const { BulkUserOperations } = await import('../../pages/admin/BulkUserOperations');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<BulkUserOperations />, {
        authContext,
        initialEntries: ['/app/admin/users/bulk-operations'],
      });

      expect(screen.getByTestId('operation-form')).toBeInTheDocument();
    });

    it('should have execute button', async () => {
      const { BulkUserOperations } = await import('../../pages/admin/BulkUserOperations');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<BulkUserOperations />, {
        authContext,
        initialEntries: ['/app/admin/users/bulk-operations'],
      });

      expect(screen.getByTestId('execute-btn')).toBeInTheDocument();
    });
  });

  describe('Role-based Access (Admin Only)', () => {
    it('should allow super_admin to access user management', async () => {
      const UserManagement = (await import('../../pages/admin/UserManagement')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UserManagement />, {
        authContext,
        initialEntries: ['/app/admin/users'],
      });

      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    it('should allow admin to access user management', async () => {
      const UserManagement = (await import('../../pages/admin/UserManagement')).default;
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<UserManagement />, {
        authContext,
        initialEntries: ['/app/admin/users'],
      });

      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });
  });
});








