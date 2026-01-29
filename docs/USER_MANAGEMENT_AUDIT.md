# User Management Module Audit

**Date:** 2026-01-29  
**Scope:** User management pages, components, hooks, and lib after major changes.  
**Goal:** Find issues that could cause "Something went wrong" (Error Boundary) or silent failures.

---

## Summary

| Severity | Issue | Location | Status |
|----------|--------|----------|--------|
| **Critical** | Treating `getUsers()` result as array instead of `{ data, meta, links }` | CapabilityMatrix, BulkUserOperations | **Fixed** |
| **Medium** | Capabilities section could throw if API returns non-array action values | UserDetails.enhanced | **Fixed** |
| Low | Permission check before loading (currentUser can be null on protected routes) | EditUser, CreateUser | Acceptable (RequireAuth guards) |
| Low | useUser(id!) in queryKey when id is null | useUsers.ts | Safe (query disabled when id null) |

---

## Critical: Wrong shape for `getUsers()` result

**Issue:** `getUsers()` (and `userService.list()`) return **`UsersResponse`** = `{ data: User[], meta?, links? }`. Two pages treated this as if it were the **array** of users, leading to:

- **CapabilityMatrix:** `let filtered = usersData` then `filtered.filter(...)` → **`.filter is not a function`** (crash).
- **BulkUserOperations:** `users.length`, `users.map(...)` on the response object → **`.map is not a function`** (crash).

These crashes are caught by the React Error Boundary and show "Something went wrong".

**Fix applied:**

1. **CapabilityMatrix.tsx**
   - Introduced `usersList = usersData?.data ?? []`.
   - `filteredUsers` is derived from `usersList` (and optional chaining on `user.name` / `user.email` for safety).

2. **BulkUserOperations.tsx**
   - Renamed query result to `usersResponse`.
   - Set `const users = usersResponse?.data ?? []` and use `users` everywhere as the list (length, map, etc.).

---

## Medium: Capabilities display in User Details

**Issue:** In **UserDetails.enhanced.tsx**, the Capabilities section does `Object.entries(user.capabilities).map(([module, actions]) => ... actions.map(...))`. If the API ever returns a capability value that is not an array (e.g. a string or object), `actions.map` throws.

**Fix applied:**

- Guard: `user.capabilities && typeof user.capabilities === 'object'`.
- For each entry: `const actionList = Array.isArray(actions) ? actions : []` and render `actionList.map(...)`.

---

## What was checked and is OK

- **hasCapability(user, ...)** – `user` is typed as `User | null`; evaluator and lib handle null.
- **UserManagement.tsx** – Uses `useUsers()`; correctly uses `data?.data`, `data?.meta`, and `currentUser?.id`.
- **EditUser / CreateUser** – Use `hasCapability(currentUser, ...)`. Protected by RequireAuth so currentUser is set when the page renders; null is handled by hasCapability.
- **UserList, UserForm** – Use `user.id` only when a user object is present; no unsafe access found.
- **useUser(id, enabled)** – When `id` is null, query is disabled; no request with null id.
- **UserDetails.enhanced** – Loading and error states handled; permission check uses `hasCapability(currentUser, ...)` (null-safe).

---

## Recommendations

1. **Types / consistency**
   - Where the API is called directly (e.g. CapabilityMatrix, BulkUserOperations using `getUsers()`), use a single type for the list: e.g. `UsersResponse` for the raw response and `users = response?.data ?? []` for the list. Avoid using the same variable name for both the response and the array.

2. **CapabilityMatrix / BulkUserOperations**
   - Consider switching to `useUsers()` from `useUsers.ts` (which already returns `UsersResponse` and is used by UserManagement) so list shape is consistent and derived in one place.

3. **Existing linter issues**
   - BulkUserOperations has existing lint/type issues (showToast signature, Button props, typography, etc.). Worth fixing in a follow-up.

4. **Error reporting**
   - Error Boundary now shows "Technical details" in production; if user management errors recur, that will narrow down the component and message.

---

## Files touched in this audit

| File | Change |
|------|--------|
| `src/pages/admin/CapabilityMatrix.tsx` | Use `usersData?.data` for list; optional chaining on user fields in filter. |
| `src/pages/admin/BulkUserOperations.tsx` | Use `usersResponse?.data ?? []` as `users` list. |
| `src/pages/admin/UserDetails.enhanced.tsx` | Guard capabilities object; ensure action values are arrays before `.map`. |

No changes were made to: UserManagement.tsx, EditUser.tsx, CreateUser.tsx, UserList.tsx, UserForm.tsx, useUsers.ts, users.ts, UserService.ts (audited only).

---

## Final re-audit (pre-push)

- **CapabilityMatrix:** `usersList = usersData?.data ?? []`; `filteredUsers` derived from `usersList`; optional chaining on `user.name` / `user.email` in filter. ✓
- **BulkUserOperations:** `users = usersResponse?.data ?? []`; all list usage (length, map, empty state) uses `users`. ✓
- **UserDetails.enhanced:** Capabilities guarded with `typeof user.capabilities === 'object'` and `actionList = Array.isArray(actions) ? actions : []`. ✓
- **TypeScript:** `npx tsc --noEmit` passes. ✓
- **Lint:** No new errors on CapabilityMatrix, UserDetails.enhanced. ✓
- **Build:** Not run in this environment (EPERM on node_modules); run `npm run build` locally before deploy.
