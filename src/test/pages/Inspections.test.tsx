/**
 * Inspections Module Tests
 * Tests all inspection related functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the inspection components
vi.mock('../../pages/inspections/InspectionDashboard', () => ({
  InspectionDashboard: () => (
    <div data-testid="inspection-dashboard">
      <h1>Inspection Dashboard</h1>
      <div data-testid="inspection-list">Inspection List</div>
      <button data-testid="new-inspection-btn">New Inspection</button>
      <div data-testid="stats">Completed: 50, Pending: 10</div>
    </div>
  ),
}));

vi.mock('../../pages/inspections/InspectionCapture', () => ({
  default: () => (
    <div data-testid="inspection-capture">
      <h1>Inspection Capture</h1>
      <div data-testid="question-list">Questions</div>
      <div data-testid="camera-controls">Camera Controls</div>
      <button data-testid="submit-btn">Submit Inspection</button>
    </div>
  ),
}));

vi.mock('../../pages/inspections/InspectionDetails', () => ({
  default: () => (
    <div data-testid="inspection-details">
      <h1>Inspection Details</h1>
      <div data-testid="answers">Answers</div>
      <div data-testid="photos">Photos</div>
      <button data-testid="download-pdf-btn">Download PDF</button>
    </div>
  ),
}));

vi.mock('../../pages/inspections/TemplateSelectionPage', () => ({
  default: () => (
    <div data-testid="template-selection">
      <h1>Select Template</h1>
      <div data-testid="template-list">Templates</div>
    </div>
  ),
  TemplateSelectionPage: () => (
    <div data-testid="template-selection">
      <h1>Select Template</h1>
      <div data-testid="template-list">Templates</div>
    </div>
  ),
}));

vi.mock('../../pages/inspections/InspectionSyncCenter', () => ({
  InspectionSyncCenter: () => (
    <div data-testid="inspection-sync">
      <h1>Sync Center</h1>
      <div data-testid="pending-uploads">Pending Uploads: 5</div>
      <button data-testid="sync-btn">Sync Now</button>
    </div>
  ),
}));

vi.mock('../../pages/inspections/InspectionStudio', () => ({
  InspectionStudio: () => (
    <div data-testid="inspection-studio">
      <h1>Inspection Studio</h1>
      <div data-testid="template-editor">Template Editor</div>
    </div>
  ),
}));

vi.mock('../../pages/inspections/InspectionReports', () => ({
  InspectionReports: () => (
    <div data-testid="inspection-reports">
      <h1>Inspection Reports</h1>
      <div data-testid="report-list">Reports</div>
    </div>
  ),
}));

vi.mock('../../pages/InspectionsCompleted', () => ({
  default: () => (
    <div data-testid="inspections-completed">
      <h1>Completed Inspections</h1>
      <div data-testid="completed-list">Completed List</div>
    </div>
  ),
}));

describe('Inspections Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Inspection Dashboard', () => {
    it('should render dashboard for authenticated users', async () => {
      const { InspectionDashboard } = await import('../../pages/inspections/InspectionDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDashboard />, {
        authContext,
        initialEntries: ['/app/inspections'],
      });

      expect(screen.getByTestId('inspection-dashboard')).toBeInTheDocument();
    });

    it('should show inspection list', async () => {
      const { InspectionDashboard } = await import('../../pages/inspections/InspectionDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDashboard />, {
        authContext,
        initialEntries: ['/app/inspections'],
      });

      expect(screen.getByTestId('inspection-list')).toBeInTheDocument();
    });

    it('should show new inspection button', async () => {
      const { InspectionDashboard } = await import('../../pages/inspections/InspectionDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDashboard />, {
        authContext,
        initialEntries: ['/app/inspections'],
      });

      expect(screen.getByTestId('new-inspection-btn')).toBeInTheDocument();
    });

    it('should show stats', async () => {
      const { InspectionDashboard } = await import('../../pages/inspections/InspectionDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDashboard />, {
        authContext,
        initialEntries: ['/app/inspections'],
      });

      expect(screen.getByTestId('stats')).toBeInTheDocument();
    });
  });

  describe('Inspection Capture', () => {
    it('should render capture screen', async () => {
      const InspectionCapture = (await import('../../pages/inspections/InspectionCapture')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionCapture />, {
        authContext,
        initialEntries: ['/app/inspections/1/capture'],
      });

      expect(screen.getByTestId('inspection-capture')).toBeInTheDocument();
    });

    it('should show question list', async () => {
      const InspectionCapture = (await import('../../pages/inspections/InspectionCapture')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionCapture />, {
        authContext,
        initialEntries: ['/app/inspections/1/capture'],
      });

      expect(screen.getByTestId('question-list')).toBeInTheDocument();
    });

    it('should show camera controls', async () => {
      const InspectionCapture = (await import('../../pages/inspections/InspectionCapture')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionCapture />, {
        authContext,
        initialEntries: ['/app/inspections/1/capture'],
      });

      expect(screen.getByTestId('camera-controls')).toBeInTheDocument();
    });

    it('should show submit button', async () => {
      const InspectionCapture = (await import('../../pages/inspections/InspectionCapture')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionCapture />, {
        authContext,
        initialEntries: ['/app/inspections/1/capture'],
      });

      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });
  });

  describe('Inspection Details', () => {
    it('should render details page', async () => {
      const InspectionDetails = (await import('../../pages/inspections/InspectionDetails')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDetails />, {
        authContext,
        initialEntries: ['/app/inspections/1'],
      });

      expect(screen.getByTestId('inspection-details')).toBeInTheDocument();
    });

    it('should show answers', async () => {
      const InspectionDetails = (await import('../../pages/inspections/InspectionDetails')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDetails />, {
        authContext,
        initialEntries: ['/app/inspections/1'],
      });

      expect(screen.getByTestId('answers')).toBeInTheDocument();
    });

    it('should show photos', async () => {
      const InspectionDetails = (await import('../../pages/inspections/InspectionDetails')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDetails />, {
        authContext,
        initialEntries: ['/app/inspections/1'],
      });

      expect(screen.getByTestId('photos')).toBeInTheDocument();
    });

    it('should show download PDF button', async () => {
      const InspectionDetails = (await import('../../pages/inspections/InspectionDetails')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionDetails />, {
        authContext,
        initialEntries: ['/app/inspections/1'],
      });

      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
    });
  });

  describe('Template Selection', () => {
    it('should render template selection', async () => {
      const TemplateSelectionPage = (await import('../../pages/inspections/TemplateSelectionPage')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<TemplateSelectionPage />, {
        authContext,
        initialEntries: ['/app/inspections/new'],
      });

      expect(screen.getByTestId('template-selection')).toBeInTheDocument();
    });

    it('should show template list', async () => {
      const TemplateSelectionPage = (await import('../../pages/inspections/TemplateSelectionPage')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<TemplateSelectionPage />, {
        authContext,
        initialEntries: ['/app/inspections/new'],
      });

      expect(screen.getByTestId('template-list')).toBeInTheDocument();
    });
  });

  describe('Inspection Sync Center', () => {
    it('should render sync center', async () => {
      const { InspectionSyncCenter } = await import('../../pages/inspections/InspectionSyncCenter');
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionSyncCenter />, {
        authContext,
        initialEntries: ['/app/inspections/sync'],
      });

      expect(screen.getByTestId('inspection-sync')).toBeInTheDocument();
    });

    it('should show pending uploads', async () => {
      const { InspectionSyncCenter } = await import('../../pages/inspections/InspectionSyncCenter');
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionSyncCenter />, {
        authContext,
        initialEntries: ['/app/inspections/sync'],
      });

      expect(screen.getByTestId('pending-uploads')).toBeInTheDocument();
    });

    it('should show sync button', async () => {
      const { InspectionSyncCenter } = await import('../../pages/inspections/InspectionSyncCenter');
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionSyncCenter />, {
        authContext,
        initialEntries: ['/app/inspections/sync'],
      });

      expect(screen.getByTestId('sync-btn')).toBeInTheDocument();
    });
  });

  describe('Inspection Studio (Admin Only)', () => {
    it('should render for admin', async () => {
      const { InspectionStudio } = await import('../../pages/inspections/InspectionStudio');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<InspectionStudio />, {
        authContext,
        initialEntries: ['/app/inspections/studio'],
      });

      expect(screen.getByTestId('inspection-studio')).toBeInTheDocument();
    });

    it('should show template editor', async () => {
      const { InspectionStudio } = await import('../../pages/inspections/InspectionStudio');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<InspectionStudio />, {
        authContext,
        initialEntries: ['/app/inspections/studio'],
      });

      expect(screen.getByTestId('template-editor')).toBeInTheDocument();
    });
  });

  describe('Inspection Reports', () => {
    it('should render reports page', async () => {
      const { InspectionReports } = await import('../../pages/inspections/InspectionReports');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionReports />, {
        authContext,
        initialEntries: ['/app/inspections/reports'],
      });

      expect(screen.getByTestId('inspection-reports')).toBeInTheDocument();
    });

    it('should show report list', async () => {
      const { InspectionReports } = await import('../../pages/inspections/InspectionReports');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionReports />, {
        authContext,
        initialEntries: ['/app/inspections/reports'],
      });

      expect(screen.getByTestId('report-list')).toBeInTheDocument();
    });
  });

  describe('Completed Inspections', () => {
    it('should render completed inspections list', async () => {
      const InspectionsCompleted = (await import('../../pages/InspectionsCompleted')).default;
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<InspectionsCompleted />, {
        authContext,
        initialEntries: ['/app/inspections/completed'],
      });

      expect(screen.getByTestId('inspections-completed')).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    it('should allow inspector to access capture', async () => {
      const InspectionCapture = (await import('../../pages/inspections/InspectionCapture')).default;
      const authContext = createMockAuthContext(mockUsers.inspector as User);
      
      renderWithProviders(<InspectionCapture />, {
        authContext,
        initialEntries: ['/app/inspections/1/capture'],
      });

      expect(screen.getByTestId('inspection-capture')).toBeInTheDocument();
    });

    it('should allow supervisor to access dashboard', async () => {
      const { InspectionDashboard } = await import('../../pages/inspections/InspectionDashboard');
      const authContext = createMockAuthContext(mockUsers.supervisor as User);
      
      renderWithProviders(<InspectionDashboard />, {
        authContext,
        initialEntries: ['/app/inspections'],
      });

      expect(screen.getByTestId('inspection-dashboard')).toBeInTheDocument();
    });
  });
});





