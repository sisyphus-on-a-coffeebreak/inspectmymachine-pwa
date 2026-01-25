/**
 * Test Utilities for VOMS PWA
 * Provides common test helpers, mock providers, and test data
 */

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../providers/AuthContext';
import type { User, AuthContextType } from '../providers/authTypes';
import { vi } from 'vitest';

// Mock user data for testing
export const mockUsers = {
  superAdmin: {
    id: 1,
    name: 'Super Admin',
    employee_id: 'SUPER001',
    email: 'superadmin@test.com',
    role: 'super_admin' as const,
    is_active: true,
    capabilities: {
      gate_pass: ['create', 'read', 'update', 'delete', 'approve'],
      inspection: ['create', 'read', 'update', 'delete'],
      expense: ['create', 'read', 'update', 'delete', 'approve'],
      stockyard: ['create', 'read', 'update', 'delete'],
      user_management: ['create', 'read', 'update', 'delete'],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  admin: {
    id: 2,
    name: 'Admin User',
    employee_id: 'ADMIN001',
    email: 'admin@test.com',
    role: 'admin' as const,
    is_active: true,
    capabilities: {
      gate_pass: ['create', 'read', 'update', 'approve'],
      inspection: ['create', 'read', 'update'],
      expense: ['create', 'read', 'update', 'approve'],
      stockyard: ['create', 'read', 'update'],
      user_management: ['create', 'read', 'update'],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  supervisor: {
    id: 3,
    name: 'Supervisor User',
    employee_id: 'SUP001',
    email: 'supervisor@test.com',
    role: 'supervisor' as const,
    is_active: true,
    capabilities: {
      gate_pass: ['create', 'read', 'update', 'approve'],
      inspection: ['create', 'read', 'update'],
      expense: ['create', 'read', 'approve'],
      stockyard: ['create', 'read'],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  inspector: {
    id: 4,
    name: 'Inspector User',
    employee_id: 'INS001',
    email: 'inspector@test.com',
    role: 'inspector' as const,
    is_active: true,
    capabilities: {
      gate_pass: ['read'],
      inspection: ['create', 'read', 'update'],
      expense: ['create', 'read'],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  guard: {
    id: 5,
    name: 'Guard User',
    employee_id: 'GUARD001',
    email: 'guard@test.com',
    role: 'guard' as const,
    is_active: true,
    capabilities: {
      gate_pass: ['read', 'validate'],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  clerk: {
    id: 6,
    name: 'Clerk User',
    employee_id: 'CLERK001',
    email: 'clerk@test.com',
    role: 'clerk' as const,
    is_active: true,
    capabilities: {
      gate_pass: ['read'],
      expense: ['create', 'read'],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
} as const;

// Create mock auth context
export function createMockAuthContext(
  user: User | null = null,
  overrides: Partial<AuthContextType> = {}
): AuthContextType {
  return {
    user,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    fetchJson: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

// Create query client for testing
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Props for custom providers
interface ProvidersProps {
  children: ReactNode;
  authContext?: AuthContextType;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

// All Providers wrapper for testing
export function AllProviders({
  children,
  authContext = createMockAuthContext(mockUsers.superAdmin as User),
  queryClient = createTestQueryClient(),
  initialEntries = ['/'],
}: ProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContext}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: AuthContextType;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    authContext = createMockAuthContext(mockUsers.superAdmin as User),
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <AllProviders
        authContext={authContext}
        queryClient={queryClient}
        initialEntries={initialEntries}
      >
        {children}
      </AllProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Mock API responses
export const mockApiResponses = {
  gatePasses: {
    list: {
      data: [
        { id: 1, type: 'visitor', visitor_name: 'John Doe', status: 'active', created_at: '2024-01-01' },
        { id: 2, type: 'vehicle', vehicle_number: 'KA01AB1234', status: 'pending', created_at: '2024-01-02' },
      ],
      meta: { current_page: 1, last_page: 1, total: 2 },
    },
    stats: {
      total: 100,
      active: 50,
      pending: 25,
      expired: 25,
      today: 10,
    },
  },
  inspections: {
    list: {
      data: [
        { id: 1, template_id: 1, vehicle_id: 1, status: 'completed', created_at: '2024-01-01' },
        { id: 2, template_id: 1, vehicle_id: 2, status: 'draft', created_at: '2024-01-02' },
      ],
      meta: { current_page: 1, last_page: 1, total: 2 },
    },
    templates: {
      data: [
        { id: 1, name: 'Basic Inspection', description: 'Basic vehicle inspection', is_active: true },
        { id: 2, name: 'Full Inspection', description: 'Comprehensive inspection', is_active: true },
      ],
    },
  },
  expenses: {
    list: {
      data: [
        { id: 1, amount: 100.50, category: 'FUEL', status: 'approved', created_at: '2024-01-01' },
        { id: 2, amount: 250.00, category: 'MAINTENANCE', status: 'pending', created_at: '2024-01-02' },
      ],
      meta: { current_page: 1, last_page: 1, total: 2 },
    },
    summary: {
      total_amount: 350.50,
      pending_count: 1,
      approved_count: 1,
    },
  },
  stockyard: {
    requests: {
      data: [
        { id: 1, type: 'inbound', status: 'pending', vehicle_id: 1, created_at: '2024-01-01' },
        { id: 2, type: 'outbound', status: 'completed', vehicle_id: 2, created_at: '2024-01-02' },
      ],
    },
    components: {
      data: [
        { id: 1, name: 'Engine', type: 'mechanical', status: 'available', location: 'Yard A' },
        { id: 2, name: 'Transmission', type: 'mechanical', status: 'in_use', location: 'Yard B' },
      ],
    },
  },
  users: {
    list: {
      data: Object.values(mockUsers),
      meta: { current_page: 1, last_page: 1, total: Object.keys(mockUsers).length },
    },
  },
  approvals: {
    pending: {
      gate_pass: [
        { id: 1, type: 'visitor', created_at: '2024-01-01', requested_by: 'John Doe' },
      ],
      expense: [
        { id: 1, amount: 250, category: 'MAINTENANCE', requested_by: 'Jane Doe' },
      ],
      transfer: [],
    },
  },
};

// Wait for loading states
export async function waitForLoadingToFinish() {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Mock fetch responses
export function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const path = url.replace(/^.*\/api/, '');
    const response = responses[path];
    
    if (response) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
        headers: new Headers(),
      });
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
      headers: new Headers(),
    });
  });
}

// Export everything for use in tests
export * from '@testing-library/react';
export { vi } from 'vitest';








