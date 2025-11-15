# Prompt for New Chat Session - VOMS PWA Remaining Tasks

Copy and paste this entire prompt into a new chat session to continue working on the remaining tasks.

---

## Project Context

I'm working on the **VOMS (Vehicle Operations Management System) PWA**, a Laravel backend + React frontend application for managing vehicle inspections, gate passes, expenses, stockyard operations, and user administration.

**Project Structure:**
- Backend: Laravel API (`vosm/` directory)
- Frontend: React + TypeScript + Vite (`src/` directory)
- State Management: React Query (TanStack Query) for data fetching
- API Client: Custom `apiClient` wrapper around axios (located in `src/lib/apiClient.ts`)
- Styling: Custom theme system (`src/lib/theme.ts`) with consistent colors, spacing, typography

**Key Technologies:**
- React Router for navigation
- React Query for data fetching and caching
- Custom UI components in `src/components/ui/`
- Laravel Sanctum for authentication
- UUIDs for all primary keys

---

## Current Status

**Phase 1 & 2 Complete:**
- ✅ Navigation & UX Foundation (breadcrumbs, deep linking, recently viewed panel)
- ✅ Related Items panels on all detail pages
- ✅ Anomaly alerts on detail pages (Gate Pass, Expense, Inspection)
- ✅ Expense timeline and duplicate detection
- ✅ Improved loading states with skeleton loaders
- ✅ Enhanced empty states with retry actions
- ✅ React Query migration for data fetching
- ✅ Standardized error handling (`src/lib/errorHandling.ts`)
- ✅ Technical debt cleanup (console logs removed, axios calls migrated to apiClient)

**Remaining Work:**
There are **35 remaining tasks** documented in `HANDOVER_REMAINING_TASKS.md`. These include:
- Workflow automation (auto-create inspections, auto-link expenses, etc.)
- Component Ledger System for stockyard (batteries, tyres, spares tracking)
- Admin features (user activity dashboard, capability matrix)
- Alert & notification system
- Compliance tracking

---

## Handover Document

**IMPORTANT:** Read `HANDOVER_REMAINING_TASKS.md` for complete details on all remaining tasks. This document includes:
- Detailed task descriptions
- Database schemas
- Implementation guidance
- Files to create/modify
- API endpoints
- Dependencies between tasks
- Priority recommendations

---

## Your Task

I want to continue implementing the remaining tasks from `HANDOVER_REMAINING_TASKS.md`. Please:

1. **Read the handover document** (`HANDOVER_REMAINING_TASKS.md`) to understand the remaining tasks
2. **Start with high-priority tasks** (as indicated in the Priority Matrix section)
3. **Follow existing patterns** in the codebase:
   - Use `apiClient` from `src/lib/apiClient.ts` for all API calls (NOT direct axios)
   - Use React Query hooks from `src/lib/queries.ts` for data fetching
   - Use error handling utilities from `src/lib/errorHandling.ts`
   - Use UI components from `src/components/ui/` (StatCard, Badge, Tooltip, etc.)
   - Follow the theme system in `src/lib/theme.ts`
   - Add breadcrumbs to all new pages using `PageHeader` component
   - Use skeleton loaders for loading states
   - Use `NetworkError` component for error states
   - Use `EmptyState` component for empty states

4. **For database changes:**
   - Create Laravel migrations in `vosm/database/migrations/`
   - Use UUIDs for primary keys (consistent with existing schema)
   - Add indexes for foreign keys and frequently queried fields
   - Use soft deletes where appropriate (`deleted_at` timestamp)

5. **For backend changes:**
   - Follow existing controller patterns in `vosm/app/Http/Controllers/`
   - Use Laravel validation for all inputs
   - Return consistent JSON responses: `{ success: true, data: {...} }`
   - Handle errors gracefully with try-catch blocks
   - Log important actions for audit trail

6. **For frontend changes:**
   - Use TypeScript for all new files
   - Follow existing component patterns
   - Add proper error handling
   - Test responsive design (mobile, tablet, desktop)
   - Ensure accessibility (keyboard navigation, ARIA labels)

---

## Recommended Starting Point

Based on the Priority Matrix in the handover document, I recommend starting with:

**Option 1: Alert System (High Priority, Foundation)**
- `workflow-1`: Implement Alert System for Anomaly Detection
- `workflow-2`: Add Anomaly Detection Rules
- `workflow-3`: Create Alert Dashboard

**Option 2: Component Ledger (High Priority, Blocks Other Features)**
- `stock-3`: Design Component Ledger Database Schema
- `stock-4`: Create Component Models
- `stock-5`: Create ComponentLedger Page

**Option 3: Workflow Automation (Medium Priority, High Value)**
- `workflow-5`: Auto-create Inspections from Gate Passes
- `workflow-6`: Auto-link Expenses to Related Items
- `workflow-7`: Auto-flag Overdue Items

---

## Key Files to Reference

**Frontend:**
- `src/lib/apiClient.ts` - API client wrapper
- `src/lib/queries.ts` - React Query hooks
- `src/lib/errorHandling.ts` - Error handling utilities
- `src/lib/theme.ts` - Theme constants
- `src/components/ui/` - Reusable UI components
- `src/pages/` - Page components

**Backend:**
- `vosm/app/Http/Controllers/` - API controllers
- `vosm/app/Models/` - Eloquent models
- `vosm/database/migrations/` - Database migrations
- `vosm/app/Services/` - Service classes (if they exist)

**Examples:**
- See `src/pages/gatepass/GatePassDashboard.tsx` for React Query usage
- See `src/pages/expenses/ExpenseDetails.tsx` for related items and anomaly alerts
- See `src/pages/inspections/InspectionDetails.tsx` for detail page patterns

---

## Important Guidelines

1. **Always use `apiClient`** - Never use direct axios calls. All API calls should go through `src/lib/apiClient.ts`

2. **Use React Query** - For data fetching, use React Query hooks. See `src/lib/queries.ts` for examples.

3. **Error Handling** - Use utilities from `src/lib/errorHandling.ts`:
   - `getUserFriendlyError()` - Convert errors to user-friendly messages
   - `getErrorToast()` - Get toast notification props from error
   - `normalizeError()` - Normalize error objects

4. **UI Components** - Use existing components from `src/components/ui/`:
   - `StatCard` - For statistics display
   - `Badge` - For status indicators
   - `Tooltip` - For contextual help
   - `SkeletonLoader` - For loading states
   - `NetworkError` - For error states
   - `EmptyState` - For empty states
   - `AnomalyAlert` - For warnings/alerts
   - `RelatedItems` - For related items panels
   - `PageHeader` - For page headers with breadcrumbs

5. **Styling** - Use theme constants from `src/lib/theme.ts`:
   - `colors` - Color palette
   - `spacing` - Spacing scale
   - `typography` - Typography styles
   - `borderRadius` - Border radius values
   - `cardStyles` - Card styling

6. **Navigation** - Add breadcrumbs to all new pages:
   ```typescript
   <PageHeader
     title="Page Title"
     breadcrumbs={[
       { label: 'Dashboard', path: '/dashboard' },
       { label: 'Module', path: '/app/module' },
       { label: 'Current Page' }
     ]}
   />
   ```

7. **Testing** - Before completing a task:
   - Test all CRUD operations
   - Test error handling
   - Test loading states
   - Test empty states
   - Test responsive design
   - Test accessibility

---

## Task Selection

When I say "start with [task-id]" or "implement [task-id]", please:
1. Read the task details from `HANDOVER_REMAINING_TASKS.md`
2. Check dependencies (make sure prerequisite tasks are done)
3. Implement following the guidelines above
4. Test thoroughly
5. Update the todo list when complete

If a task has dependencies that aren't complete, let me know and suggest starting with the dependencies first.

---

## Questions?

If you need clarification on:
- Existing code patterns
- Database schema
- API endpoints
- Component usage
- Task requirements

Please ask! I'm here to help guide you through the implementation.

---

## Ready to Start

I'm ready to begin implementing the remaining tasks. Please:
1. Acknowledge you've read this prompt and the handover document
2. Suggest which task(s) to start with based on priority
3. Begin implementation following the guidelines above

Let's continue building! 🚀

