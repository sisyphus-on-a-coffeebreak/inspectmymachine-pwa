# VOMS PWA Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Component Library](#component-library)
6. [State Management](#state-management)
7. [API Layer](#api-layer)
8. [Authentication & Authorization](#authentication--authorization)
9. [Styling Guide](#styling-guide)
10. [Testing](#testing)
11. [Best Practices](#best-practices)

---

## Architecture Overview

VOMS PWA is a Progressive Web Application built with:

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.9.2 | Type Safety |
| Vite | 7.1.0 | Build Tool |
| TanStack Query | 5.x | Server State Management |
| React Router | 6.x | Routing |
| Vitest | 1.x | Testing |

### Key Architectural Patterns

1. **Lazy Loading**: All page components use `React.lazy()` for code splitting
2. **Memoization**: Use `useMemo`, `useCallback`, and `React.memo` for performance
3. **Centralized API**: All API calls go through `src/lib/apiClient.ts`
4. **RBAC**: Role-Based Access Control via `src/lib/users.ts`
5. **Theme System**: Centralized styling via `src/lib/theme.ts`

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd voms-pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Modal, etc.)
│   ├── admin/           # Admin-specific components
│   └── settings/        # Settings-related components
├── pages/               # Page components (routes)
│   ├── admin/           # Admin pages
│   ├── auth/            # Authentication pages
│   ├── expenses/        # Expense management
│   ├── gatepass/        # Gate pass management
│   ├── inspections/     # Inspection management
│   ├── settings/        # Settings pages
│   └── stockyard/       # Stockyard management
├── lib/                 # Utilities and services
│   ├── apiClient.ts     # Axios-based API client
│   ├── theme.ts         # Styling constants
│   ├── users.ts         # User/permission utilities
│   ├── sessions.ts      # Session management
│   ├── security.ts      # Security utilities
│   └── ...              # Other service modules
├── hooks/               # Custom React hooks
├── providers/           # React Context providers
├── test/                # Test utilities and setup
└── types/               # TypeScript type definitions
```

---

## Core Concepts

### Lazy Loading Pages

All page components should be lazy loaded:

```typescript
// In App.tsx
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));

// Usage in routes
<Route
  path="/app/admin/users"
  element={
    <AuthenticatedLayout>
      <LazyPage>
        <UserManagement />
      </LazyPage>
    </AuthenticatedLayout>
  }
/>
```

### Memoization

Use memoization to prevent unnecessary re-renders:

```typescript
// Memoize expensive computations
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);

// Memoize components
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});
```

---

## Component Library

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

<Button variant="secondary" disabled loading>
  Loading...
</Button>

<Button variant="ghost" icon={<IconComponent />}>
  With Icon
</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'warning' | 'critical'`
- `size`: `'sm' | 'md' | 'lg'`
- `disabled`: boolean
- `loading`: boolean
- `icon`: ReactNode
- `fullWidth`: boolean

### Modal

```tsx
import { Modal } from '@/components/ui/Modal';

<Modal
  title="Confirm Action"
  onClose={() => setOpen(false)}
>
  <p>Modal content here</p>
</Modal>
```

### ConfirmDialog

```tsx
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete User?"
  message="This action cannot be undone."
  confirmText="Delete"
  confirmVariant="critical"
  requireTyping={true}
  typingConfirmation="DELETE"
/>
```

### PermissionGate

```tsx
import { PermissionGate, useHasCapability } from '@/components/ui/PermissionGate';

// Declarative approach
<PermissionGate module="user_management" action="create">
  <Button>Create User</Button>
</PermissionGate>

// Hook approach
const canDelete = useHasCapability('user_management', 'delete');
{canDelete && <Button onClick={handleDelete}>Delete</Button>}
```

### Pagination

```tsx
import { Pagination } from '@/components/ui/Pagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={totalItems}
  perPage={perPage}
  onPageChange={setPage}
  onPerPageChange={setPerPage}
/>
```

### PasswordStrengthMeter

```tsx
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

<PasswordStrengthMeter
  password={password}
  showRequirements={true}
  showFeedback={true}
/>
```

---

## State Management

### Server State (TanStack Query)

Use TanStack Query for all server state:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetching data
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => getUsers(filters),
  keepPreviousData: true, // For pagination
});

// Mutations
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    showToast({ title: 'User created', variant: 'success' });
  },
  onError: (error) => {
    showToast({ title: 'Failed to create user', variant: 'error' });
  },
});
```

### Client State (React Context)

Use React Context for global client state:

```typescript
// Provider
import { useAuth } from '@/providers/useAuth';

const { user, loading, login, logout } = useAuth();

// Toast notifications
import { useToast } from '@/providers/ToastProvider';

const { showToast } = useToast();
showToast({
  title: 'Success',
  description: 'Operation completed',
  variant: 'success',
});
```

---

## API Layer

### API Client

All API calls should go through the centralized client:

```typescript
import { apiClient } from '@/lib/apiClient';

// GET request
const response = await apiClient.get<UserResponse>('/v1/users');

// POST request
const response = await apiClient.post<User>('/v1/users', userData);

// PUT request
const response = await apiClient.put<User>(`/v1/users/${id}`, userData);

// DELETE request
await apiClient.delete(`/v1/users/${id}`);
```

### Creating Service Modules

```typescript
// src/lib/users.ts
import { apiClient } from './apiClient';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function getUsers(params?: GetUsersParams): Promise<UsersResponse> {
  try {
    const response = await apiClient.get<UsersResponse>('/v1/users', { params });
    return response.data;
  } catch (error) {
    console.error('[users] Failed to fetch users:', error);
    throw error;
  }
}
```

### Error Handling

```typescript
import { getUserFriendlyError, getErrorToast } from '@/lib/errorHandling';

try {
  await apiClient.post('/v1/users', data);
} catch (error) {
  const message = getUserFriendlyError(error);
  showToast(getErrorToast(error, 'create user'));
}
```

---

## Authentication & Authorization

### Checking User Role

```typescript
import { useAuth } from '@/providers/useAuth';

const { user } = useAuth();

if (user?.role === 'super_admin') {
  // Super admin specific logic
}
```

### Checking Capabilities

```typescript
import { hasCapability } from '@/lib/users';

// Check if user has a specific capability
if (hasCapability(user, 'user_management', 'delete')) {
  // User can delete users
}
```

### Route Protection

```typescript
// In App.tsx
<Route
  path="/app/admin/users"
  element={
    <AuthenticatedLayout>
      <RequireRole roles={['super_admin', 'admin']}>
        <LazyPage>
          <UserManagement />
        </LazyPage>
      </RequireRole>
    </AuthenticatedLayout>
  }
/>
```

---

## Styling Guide

### Using the Theme

```typescript
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '@/lib/theme';

const styles = {
  container: {
    padding: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  title: {
    ...typography.header,
    color: colors.neutral[900],
  },
  card: {
    ...cardStyles.base,
    padding: spacing.lg,
  },
};
```

### Theme Constants

```typescript
// Colors
colors.primary      // Primary brand color
colors.success      // Success/positive actions
colors.warning      // Warnings
colors.critical     // Errors/destructive actions
colors.neutral[100-900] // Grayscale

// Spacing
spacing.xs  // 4px
spacing.sm  // 8px
spacing.md  // 16px
spacing.lg  // 24px
spacing.xl  // 32px

// Typography
typography.header   // Page headers
typography.subheader // Section headers
typography.body     // Body text
typography.caption  // Small text

// Border Radius
borderRadius.sm     // 4px
borderRadius.md     // 8px
borderRadius.lg     // 12px
borderRadius.full   // 9999px (pill)
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- users.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Setup

Tests use:
- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **happy-dom**: DOM environment
- **jest-dom**: Custom matchers

---

## Best Practices

### DO ✅

1. **Use TypeScript strictly** - No `any` types
2. **Memoize expensive operations** - Use `useMemo` and `useCallback`
3. **Lazy load pages** - Use `React.lazy()`
4. **Use the theme system** - Import from `@/lib/theme`
5. **Handle errors gracefully** - Use `errorHandling.ts` utilities
6. **Write tests** - Especially for business logic
7. **Use PermissionGate** - For permission-based UI
8. **Follow DRY** - Reuse existing components and utilities

### DON'T ❌

1. **Inline styles without theme** - Always use theme constants
2. **Create files > 500 lines** - Split into smaller modules
3. **Use console.log** - Use proper logging utilities
4. **Skip error handling** - Always handle API errors
5. **Ignore TypeScript errors** - Fix them properly
6. **Create new components for one-time use** - Only if truly reusable

### Code Review Checklist

- [ ] No `any` types
- [ ] No `console.log` statements
- [ ] Proper error handling
- [ ] Uses theme constants
- [ ] Memoization where appropriate
- [ ] TypeScript interfaces defined
- [ ] Tests added for new features
- [ ] Accessible (ARIA labels, keyboard nav)





