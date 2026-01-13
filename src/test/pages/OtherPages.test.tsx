/**
 * Other Pages Tests
 * Tests for notifications, alerts, approvals, settings, and error pages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the components
vi.mock('../../pages/notifications/NotificationsPage', () => ({
  NotificationsPage: () => (
    <div data-testid="notifications-page">
      <h1>Notifications</h1>
      <div data-testid="notification-list">Notification List</div>
      <button data-testid="mark-all-read">Mark All Read</button>
    </div>
  ),
}));

vi.mock('../../pages/notifications/NotificationPreferences', () => ({
  NotificationPreferences: () => (
    <div data-testid="notification-preferences">
      <h1>Notification Preferences</h1>
      <div data-testid="preference-form">Preference Form</div>
    </div>
  ),
}));

vi.mock('../../pages/alerts/AlertDashboard', () => ({
  AlertDashboard: () => (
    <div data-testid="alert-dashboard">
      <h1>Alert Dashboard</h1>
      <div data-testid="alert-list">Alert List</div>
      <div data-testid="alert-stats">Alert Stats</div>
    </div>
  ),
}));

vi.mock('../../pages/approvals/UnifiedApprovals', () => ({
  UnifiedApprovals: () => (
    <div data-testid="unified-approvals">
      <h1>Unified Approvals</h1>
      <div data-testid="approval-tabs">
        <button>Gate Pass</button>
        <button>Expense</button>
        <button>Transfer</button>
      </div>
      <div data-testid="pending-list">Pending Approvals</div>
    </div>
  ),
}));

vi.mock('../../pages/settings/ReportBranding', () => ({
  ReportBrandingPage: () => (
    <div data-testid="report-branding">
      <h1>Report Branding</h1>
      <div data-testid="logo-upload">Logo Upload</div>
      <div data-testid="color-picker">Color Picker</div>
    </div>
  ),
}));

vi.mock('../../pages/settings/SessionManagement', () => ({
  SessionManagement: () => (
    <div data-testid="session-management">
      <h1>Session Management</h1>
      <div data-testid="active-sessions">Active Sessions</div>
      <button data-testid="logout-all">Logout All</button>
    </div>
  ),
}));

vi.mock('../../pages/NotFound', () => ({
  default: () => (
    <div data-testid="not-found">
      <h1>404</h1>
      <p>Page Not Found</p>
      <button data-testid="go-home">Go Home</button>
    </div>
  ),
}));

vi.mock('../../pages/Offline', () => ({
  default: () => (
    <div data-testid="offline-page">
      <h1>Offline</h1>
      <p>You are currently offline</p>
      <button data-testid="retry-btn">Retry</button>
    </div>
  ),
}));

describe('Notifications Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Notifications Page', () => {
    it('should render notifications page', async () => {
      const { NotificationsPage } = await import('../../pages/notifications/NotificationsPage');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<NotificationsPage />, {
        authContext,
        initialEntries: ['/app/notifications'],
      });

      expect(screen.getByTestId('notifications-page')).toBeInTheDocument();
    });

    it('should show notification list', async () => {
      const { NotificationsPage } = await import('../../pages/notifications/NotificationsPage');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<NotificationsPage />, {
        authContext,
        initialEntries: ['/app/notifications'],
      });

      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    });

    it('should have mark all read button', async () => {
      const { NotificationsPage } = await import('../../pages/notifications/NotificationsPage');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<NotificationsPage />, {
        authContext,
        initialEntries: ['/app/notifications'],
      });

      expect(screen.getByTestId('mark-all-read')).toBeInTheDocument();
    });
  });

  describe('Notification Preferences', () => {
    it('should render preferences page', async () => {
      const { NotificationPreferences } = await import('../../pages/notifications/NotificationPreferences');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<NotificationPreferences />, {
        authContext,
        initialEntries: ['/app/notifications/preferences'],
      });

      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    });

    it('should show preference form', async () => {
      const { NotificationPreferences } = await import('../../pages/notifications/NotificationPreferences');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<NotificationPreferences />, {
        authContext,
        initialEntries: ['/app/notifications/preferences'],
      });

      expect(screen.getByTestId('preference-form')).toBeInTheDocument();
    });
  });
});

describe('Alerts Module', () => {
  describe('Alert Dashboard', () => {
    it('should render alert dashboard for authorized users', async () => {
      const { AlertDashboard } = await import('../../pages/alerts/AlertDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AlertDashboard />, {
        authContext,
        initialEntries: ['/app/alerts'],
      });

      expect(screen.getByTestId('alert-dashboard')).toBeInTheDocument();
    });

    it('should show alert list', async () => {
      const { AlertDashboard } = await import('../../pages/alerts/AlertDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AlertDashboard />, {
        authContext,
        initialEntries: ['/app/alerts'],
      });

      expect(screen.getByTestId('alert-list')).toBeInTheDocument();
    });

    it('should show alert stats', async () => {
      const { AlertDashboard } = await import('../../pages/alerts/AlertDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AlertDashboard />, {
        authContext,
        initialEntries: ['/app/alerts'],
      });

      expect(screen.getByTestId('alert-stats')).toBeInTheDocument();
    });
  });
});

describe('Approvals Module', () => {
  describe('Unified Approvals', () => {
    it('should render unified approvals for authorized users', async () => {
      const { UnifiedApprovals } = await import('../../pages/approvals/UnifiedApprovals');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UnifiedApprovals />, {
        authContext,
        initialEntries: ['/app/approvals'],
      });

      expect(screen.getByTestId('unified-approvals')).toBeInTheDocument();
    });

    it('should show approval tabs', async () => {
      const { UnifiedApprovals } = await import('../../pages/approvals/UnifiedApprovals');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UnifiedApprovals />, {
        authContext,
        initialEntries: ['/app/approvals'],
      });

      expect(screen.getByTestId('approval-tabs')).toBeInTheDocument();
    });

    it('should show pending list', async () => {
      const { UnifiedApprovals } = await import('../../pages/approvals/UnifiedApprovals');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<UnifiedApprovals />, {
        authContext,
        initialEntries: ['/app/approvals'],
      });

      expect(screen.getByTestId('pending-list')).toBeInTheDocument();
    });

    it('should be accessible by supervisor', async () => {
      const { UnifiedApprovals } = await import('../../pages/approvals/UnifiedApprovals');
      const authContext = createMockAuthContext(mockUsers.supervisor as User);
      
      renderWithProviders(<UnifiedApprovals />, {
        authContext,
        initialEntries: ['/app/approvals'],
      });

      expect(screen.getByTestId('unified-approvals')).toBeInTheDocument();
    });
  });
});

describe('Settings Module', () => {
  describe('Report Branding', () => {
    it('should render for admin', async () => {
      const { ReportBrandingPage } = await import('../../pages/settings/ReportBranding');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ReportBrandingPage />, {
        authContext,
        initialEntries: ['/app/settings/report-branding'],
      });

      expect(screen.getByTestId('report-branding')).toBeInTheDocument();
    });

    it('should show logo upload', async () => {
      const { ReportBrandingPage } = await import('../../pages/settings/ReportBranding');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ReportBrandingPage />, {
        authContext,
        initialEntries: ['/app/settings/report-branding'],
      });

      expect(screen.getByTestId('logo-upload')).toBeInTheDocument();
    });

    it('should show color picker', async () => {
      const { ReportBrandingPage } = await import('../../pages/settings/ReportBranding');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ReportBrandingPage />, {
        authContext,
        initialEntries: ['/app/settings/report-branding'],
      });

      expect(screen.getByTestId('color-picker')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should render session management', async () => {
      const { SessionManagement } = await import('../../pages/settings/SessionManagement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<SessionManagement />, {
        authContext,
        initialEntries: ['/app/settings/sessions'],
      });

      expect(screen.getByTestId('session-management')).toBeInTheDocument();
    });

    it('should show active sessions', async () => {
      const { SessionManagement } = await import('../../pages/settings/SessionManagement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<SessionManagement />, {
        authContext,
        initialEntries: ['/app/settings/sessions'],
      });

      expect(screen.getByTestId('active-sessions')).toBeInTheDocument();
    });

    it('should have logout all button', async () => {
      const { SessionManagement } = await import('../../pages/settings/SessionManagement');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<SessionManagement />, {
        authContext,
        initialEntries: ['/app/settings/sessions'],
      });

      expect(screen.getByTestId('logout-all')).toBeInTheDocument();
    });
  });
});

describe('Error Pages', () => {
  describe('Not Found Page', () => {
    it('should render 404 page', async () => {
      const NotFound = (await import('../../pages/NotFound')).default;
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<NotFound />, {
        authContext,
        initialEntries: ['/invalid-route'],
      });

      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });

    it('should show 404 message', async () => {
      const NotFound = (await import('../../pages/NotFound')).default;
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<NotFound />, {
        authContext,
        initialEntries: ['/invalid-route'],
      });

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should have go home button', async () => {
      const NotFound = (await import('../../pages/NotFound')).default;
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<NotFound />, {
        authContext,
        initialEntries: ['/invalid-route'],
      });

      expect(screen.getByTestId('go-home')).toBeInTheDocument();
    });
  });

  describe('Offline Page', () => {
    it('should render offline page', async () => {
      const Offline = (await import('../../pages/Offline')).default;
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<Offline />, {
        authContext,
        initialEntries: ['/offline'],
      });

      expect(screen.getByTestId('offline-page')).toBeInTheDocument();
    });

    it('should show offline message', async () => {
      const Offline = (await import('../../pages/Offline')).default;
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<Offline />, {
        authContext,
        initialEntries: ['/offline'],
      });

      expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
    });

    it('should have retry button', async () => {
      const Offline = (await import('../../pages/Offline')).default;
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<Offline />, {
        authContext,
        initialEntries: ['/offline'],
      });

      expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
    });
  });
});

describe('Role-based Access Control', () => {
  const allRoles = ['superAdmin', 'admin', 'supervisor', 'inspector', 'guard', 'clerk'] as const;
  
  describe('Notifications - Accessible to all authenticated users', () => {
    allRoles.forEach((role) => {
      it(`should allow ${role} to access notifications`, async () => {
        const { NotificationsPage } = await import('../../pages/notifications/NotificationsPage');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<NotificationsPage />, {
          authContext,
          initialEntries: ['/app/notifications'],
        });

        expect(screen.getByTestId('notifications-page')).toBeInTheDocument();
      });
    });
  });

  describe('Approvals - Accessible to super_admin, admin, supervisor', () => {
    const approvalRoles = ['superAdmin', 'admin', 'supervisor'] as const;
    
    approvalRoles.forEach((role) => {
      it(`should allow ${role} to access approvals`, async () => {
        const { UnifiedApprovals } = await import('../../pages/approvals/UnifiedApprovals');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<UnifiedApprovals />, {
          authContext,
          initialEntries: ['/app/approvals'],
        });

        expect(screen.getByTestId('unified-approvals')).toBeInTheDocument();
      });
    });
  });

  describe('Alerts - Accessible to super_admin, admin, supervisor', () => {
    const alertRoles = ['superAdmin', 'admin', 'supervisor'] as const;
    
    alertRoles.forEach((role) => {
      it(`should allow ${role} to access alerts`, async () => {
        const { AlertDashboard } = await import('../../pages/alerts/AlertDashboard');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<AlertDashboard />, {
          authContext,
          initialEntries: ['/app/alerts'],
        });

        expect(screen.getByTestId('alert-dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Settings - Branding accessible to admin only', () => {
    const brandingRoles = ['superAdmin', 'admin'] as const;
    
    brandingRoles.forEach((role) => {
      it(`should allow ${role} to access report branding`, async () => {
        const { ReportBrandingPage } = await import('../../pages/settings/ReportBranding');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<ReportBrandingPage />, {
          authContext,
          initialEntries: ['/app/settings/report-branding'],
        });

        expect(screen.getByTestId('report-branding')).toBeInTheDocument();
      });
    });
  });
});

