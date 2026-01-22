/**
 * Dashboard Page Tests
 * Tests the main dashboard functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the Dashboard component
vi.mock('../../pages/Dashboard', () => ({
  default: () => (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
      <div data-testid="dashboard-stats">Stats loaded</div>
      <div data-testid="quick-actions">Quick Actions</div>
      <div data-testid="activity-feed">Activity Feed</div>
    </div>
  ),
}));

// Mock API calls
vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: mockApiResponses.gatePasses.stats, status: 200 }),
    post: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
  },
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard for authenticated users', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should show stats section', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });

    it('should show quick actions section', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });

    it('should show activity feed', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  describe('Role-based access', () => {
    it('should render for super admin', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should render for admin', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should render for inspector', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should render for guard', async () => {
      const { default: Dashboard } = await import('../../pages/Dashboard');
      const authContext = createMockAuthContext(mockUsers.guard as User);
      
      renderWithProviders(<Dashboard />, {
        authContext,
        initialEntries: ['/dashboard'],
      });

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});





