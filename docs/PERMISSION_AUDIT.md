# Permission Enforcement Audit

This document tracks all API endpoints that require permission checks and their current enforcement status.

## Overview

All privileged operations must be protected by backend permission checks. This audit ensures:
- Every endpoint requiring permissions is documented
- Permission checks are enforced on the backend
- Error responses follow a consistent format
- Frontend and backend are aligned on permission requirements

## Error Response Format

When a user lacks permission, the backend should return:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to [action] [resource]",
  "required_capability": "module.action"
}
```

HTTP Status: `403 Forbidden`

## Endpoints Requiring Permission Checks

### User Management (`/v1/users`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/users` | GET | `user_management.read` | ⚠️ TODO | List users - may need scope restrictions |
| `/v1/users` | POST | `user_management.create` | ⚠️ TODO | Create new user |
| `/v1/users/:id` | GET | `user_management.read` | ⚠️ TODO | Get single user |
| `/v1/users/:id` | PUT | `user_management.update` | ⚠️ TODO | Update user |
| `/v1/users/:id` | DELETE | `user_management.delete` | ⚠️ TODO | Delete user |
| `/v1/users/:id/reset-password` | POST | `user_management.update` | ⚠️ TODO | Reset user password |
| `/v1/users/:id/permissions` | GET | `user_management.read` | ⚠️ TODO | Get user permissions |
| `/v1/users/bulk-activate` | POST | `user_management.update` | ⚠️ TODO | Bulk activate users |
| `/v1/users/bulk-deactivate` | POST | `user_management.update` | ⚠️ TODO | Bulk deactivate users |
| `/v1/users/bulk-assign-role` | POST | `user_management.update` | ⚠️ TODO | Bulk assign role |
| `/v1/users/bulk-assign-capabilities` | POST | `user_management.update` | ⚠️ TODO | Bulk assign capabilities |

### Enhanced Capabilities (`/v1/users/:id/enhanced-capabilities`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/users/:id/enhanced-capabilities` | GET | `user_management.read` | ⚠️ TODO | List enhanced capabilities |
| `/v1/users/:id/enhanced-capabilities` | POST | `user_management.update` | ⚠️ TODO | Create enhanced capability |
| `/v1/users/:id/enhanced-capabilities/:capId` | PUT | `user_management.update` | ⚠️ TODO | Update enhanced capability |
| `/v1/users/:id/enhanced-capabilities/:capId` | DELETE | `user_management.update` | ⚠️ TODO | Remove enhanced capability |

### Gate Pass (`/v2/gate-passes`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v2/gate-passes` | GET | `gate_pass.read` | ⚠️ TODO | List gate passes - scope restrictions apply |
| `/v2/gate-passes` | POST | `gate_pass.create` | ⚠️ TODO | Create gate pass |
| `/v2/gate-passes/:id` | GET | `gate_pass.read` | ⚠️ TODO | Get single gate pass |
| `/v2/gate-passes/:id` | PATCH | `gate_pass.update` | ⚠️ TODO | Update gate pass |
| `/v2/gate-passes/:id` | DELETE | `gate_pass.delete` | ⚠️ TODO | Delete/cancel gate pass |
| `/v2/gate-passes/:id/approve` | POST | `gate_pass.approve` | ⚠️ TODO | Approve gate pass |
| `/v2/gate-passes/:id/validate` | POST | `gate_pass.validate` | ⚠️ TODO | Validate gate pass (guard action) |
| `/v2/gate-passes/:id/entry` | POST | `gate_pass.validate` | ⚠️ TODO | Record entry |
| `/v2/gate-passes/:id/exit` | POST | `gate_pass.validate` | ⚠️ TODO | Record exit |
| `/v2/gate-passes-stats` | GET | `gate_pass.read` | ⚠️ TODO | Get gate pass statistics |
| `/v2/gate-passes-guard-logs` | GET | `gate_pass.read` | ⚠️ TODO | Get guard validation logs |

### Expense Management (`/v1/expenses`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/expenses` | GET | `expense.read` | ⚠️ TODO | List expenses - scope restrictions apply |
| `/v1/expenses` | POST | `expense.create` | ⚠️ TODO | Create expense |
| `/v1/expenses/:id` | GET | `expense.read` | ⚠️ TODO | Get single expense |
| `/v1/expenses/:id` | PUT | `expense.update` | ⚠️ TODO | Update expense |
| `/v1/expenses/:id` | DELETE | `expense.delete` | ⚠️ TODO | Delete expense |
| `/v1/expenses/:id/approve` | POST | `expense.approve` | ⚠️ TODO | Approve expense |
| `/v1/expenses/:id/reject` | POST | `expense.approve` | ⚠️ TODO | Reject expense |
| `/v1/expenses/:id/reassign` | POST | `expense.reassign` | ⚠️ TODO | Reassign expense |
| `/v1/expenses/:id/audit` | GET | `expense.read` | ⚠️ TODO | Get expense audit log |
| `/v1/expenses/vehicle-kpis` | GET | `expense.read` | ⚠️ TODO | Get vehicle KPIs (may need reports.read) |

### Inspection (`/v1/inspections`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/inspections` | GET | `inspection.read` | ⚠️ TODO | List inspections - scope restrictions apply |
| `/v1/inspections` | POST | `inspection.create` | ⚠️ TODO | Create inspection |
| `/v1/inspections/:id` | GET | `inspection.read` | ⚠️ TODO | Get single inspection |
| `/v1/inspections/:id` | PUT | `inspection.update` | ⚠️ TODO | Update inspection |
| `/v1/inspections/:id` | DELETE | `inspection.delete` | ⚠️ TODO | Delete inspection |
| `/v1/inspections/:id/approve` | POST | `inspection.approve` | ⚠️ TODO | Approve inspection |
| `/v1/inspections/:id/review` | POST | `inspection.review` | ⚠️ TODO | Review inspection |
| `/v1/inspection-templates` | GET | `inspection.read` | ⚠️ TODO | List templates |
| `/v1/inspection-templates` | POST | `inspection.create` | ⚠️ TODO | Create template (may need admin) |
| `/v1/inspection-templates/:id` | PUT | `inspection.update` | ⚠️ TODO | Update template |
| `/v1/inspection-templates/:id` | DELETE | `inspection.delete` | ⚠️ TODO | Delete template |

### Permission Templates (`/v1/permission-templates`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/permission-templates` | GET | `user_management.read` | ⚠️ TODO | List templates |
| `/v1/permission-templates` | POST | `user_management.create` | ⚠️ TODO | Create template |
| `/v1/permission-templates/:id` | GET | `user_management.read` | ⚠️ TODO | Get single template |
| `/v1/permission-templates/:id` | PUT | `user_management.update` | ⚠️ TODO | Update template |
| `/v1/permission-templates/:id` | DELETE | `user_management.delete` | ⚠️ TODO | Delete template |
| `/v1/permission-templates/:id/apply/:userId` | POST | `user_management.update` | ⚠️ TODO | Apply template to user |

### Data Masking Rules (`/v1/masking-rules`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/masking-rules` | GET | `user_management.read` | ⚠️ TODO | List masking rules |
| `/v1/masking-rules` | POST | `user_management.create` | ⚠️ TODO | Create masking rule |
| `/v1/masking-rules/:id` | PUT | `user_management.update` | ⚠️ TODO | Update masking rule |
| `/v1/masking-rules/:id` | DELETE | `user_management.delete` | ⚠️ TODO | Delete masking rule |

### Reports (`/v1/reports`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/reports/*` | GET | `reports.read` | ⚠️ TODO | All report endpoints |
| `/v1/reports/*/export` | GET/POST | `reports.export` | ⚠️ TODO | Export reports |

### Stockyard (`/v1/stockyard`)

| Endpoint | Method | Required Capability | Status | Notes |
|----------|--------|---------------------|--------|-------|
| `/v1/stockyard/*` | Various | TBD | ⚠️ TODO | Stockyard operations need capability mapping |

## Status Legend

- ✅ **Verified** - Permission check is enforced and tested
- ⚠️ **TODO** - Needs backend implementation/verification
- ❌ **Missing** - No permission check found

## Implementation Checklist

### Backend Tasks

- [ ] Add permission middleware to all routes
- [ ] Return 403 with consistent error format
- [ ] Include `required_capability` in error response
- [ ] Test all endpoints with different user roles
- [ ] Document permission requirements in API docs

### Frontend Tasks

- [ ] Handle 403 errors gracefully
- [ ] Show clear "Access Denied" messages
- [ ] Hide UI elements for actions user can't perform
- [ ] Run contract tests in CI/CD pipeline

## Testing

Run contract tests to verify permission enforcement:

```bash
npm run test:contracts
```

These tests require:
- Running backend server
- Test user accounts with specific roles
- Test data setup

## Notes

1. **Scope Restrictions**: Some endpoints (like `GET /v1/users`) may need additional scope checks beyond basic capability checks (e.g., users can only see their own records unless they have broader permissions).

2. **Granular Permissions**: Enhanced capabilities support granular permissions (scope, time, conditions). Backend should evaluate these when checking permissions.

3. **Super Admin Bypass**: Super admins typically bypass permission checks, but this should be configurable for security audits.

4. **Audit Logging**: All permission-denied attempts should be logged for security monitoring.

## Related Documentation

- [Permission System Documentation](../src/lib/permissions/README.md)
- [API Client Documentation](../src/lib/apiClient.ts)
- [User Capabilities](../src/lib/users.ts)





