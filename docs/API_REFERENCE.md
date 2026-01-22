# VOMS API Reference

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Responses](#error-responses)
4. [User Management](#user-management)
5. [Sessions](#sessions)
6. [Security](#security)
7. [Activity Logs](#activity-logs)
8. [Permission Logs](#permission-logs)
9. [Reports](#reports)
10. [Gate Pass](#gate-pass)
11. [Expenses](#expenses)
12. [Inspections](#inspections)

---

## Overview

### Base URL

```
Production: https://api.voms.example.com
Development: http://localhost:8000
```

### API Versioning

All API endpoints are prefixed with `/api/v1/`.

### Request Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

### Response Format

All responses follow this structure:

```json
{
  "data": { ... },
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total": 100,
    "last_page": 2
  },
  "links": {
    "next": "...",
    "prev": null
  }
}
```

---

## Authentication

### Login

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin",
      "capabilities": { ... }
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGci..."
  }
}
```

### Logout

```http
POST /api/v1/auth/logout
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User

```http
GET /api/v1/auth/user
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "is_active": true,
    "capabilities": {
      "user_management": ["create", "read", "update", "delete"],
      "gate_pass": ["create", "read", "approve"]
    }
  }
}
```

---

## Error Responses

### Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "required_capability": "module.action"
}
```

### Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 419 | Session Expired | CSRF token mismatch |
| 422 | Validation Error | Invalid input data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

### 403 Forbidden Example

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete users",
  "required_capability": "user_management.delete"
}
```

---

## User Management

### List Users

```http
GET /api/v1/users
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| per_page | integer | Items per page (default: 50) |
| search | string | Search by name/email |
| role | string | Filter by role |
| status | string | Filter by status (active/inactive) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "employee_id": "EMP001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "admin",
      "is_active": true,
      "last_login_at": "2026-01-03T10:30:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total": 150,
    "last_page": 3
  }
}
```

### Get User

```http
GET /api/v1/users/{id}
```

### Create User

```http
POST /api/v1/users
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "employee_id": "EMP002",
  "phone": "+1234567890",
  "password": "SecurePassword123!",
  "role": "clerk",
  "is_active": true,
  "capabilities": {
    "gate_pass": ["create", "read"]
  }
}
```

### Update User

```http
PUT /api/v1/users/{id}
```

### Delete User

```http
DELETE /api/v1/users/{id}
```

### Get User Access Summary

```http
GET /api/v1/users/{id}/access-summary
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "is_active": true
  },
  "permissions": [
    {
      "module": "user_management",
      "actions": [
        { "action": "create", "granted": true, "source": "role" },
        { "action": "read", "granted": true, "source": "role" },
        { "action": "update", "granted": true, "source": "direct" },
        { "action": "delete", "granted": false, "source": null }
      ]
    }
  ],
  "enhanced_capabilities": [
    {
      "module": "expense",
      "action": "approve",
      "expires_at": "2026-02-01T00:00:00Z",
      "granted_by": "Super Admin"
    }
  ],
  "last_login": "2026-01-03T10:30:00Z",
  "session_count": 2
}
```

---

## Sessions

### List Active Sessions

```http
GET /api/v1/sessions
```

**Response:**
```json
{
  "data": [
    {
      "id": "sess_abc123",
      "user_id": 1,
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "device_type": "desktop",
      "browser": "Chrome",
      "os": "Windows",
      "location": {
        "city": "New York",
        "country": "US"
      },
      "is_current": true,
      "last_activity": "2026-01-03T15:30:00Z",
      "created_at": "2026-01-03T08:00:00Z"
    }
  ],
  "current_session_id": "sess_abc123"
}
```

### Terminate Session

```http
DELETE /api/v1/sessions/{id}
```

### Terminate All Other Sessions

```http
POST /api/v1/sessions/terminate-all
```

**Response:**
```json
{
  "terminated_count": 3
}
```

### Get Login History

```http
GET /api/v1/login-history
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |

---

## Security

### Get Security Metrics

```http
GET /api/v1/security/metrics
```

**Response:**
```json
{
  "active_sessions": 45,
  "failed_logins_24h": 12,
  "locked_accounts": 2,
  "suspicious_activities": 1,
  "new_devices_7d": 8,
  "password_changes_7d": 5
}
```

### Get Failed Logins

```http
GET /api/v1/security/failed-logins
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| hours | integer | Time window in hours (default: 24) |
| page | integer | Page number |
| per_page | integer | Items per page |

### Get Locked Accounts

```http
GET /api/v1/security/locked-accounts
```

### Unlock Account

```http
POST /api/v1/security/unlock-account/{userId}
```

### Lock Account

```http
POST /api/v1/security/lock-account/{userId}
```

**Request Body:**
```json
{
  "reason": "Security concern"
}
```

### Get Security Events

```http
GET /api/v1/security/events
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Event type filter |
| severity | string | Severity filter (info/warning/critical) |
| user_id | integer | Filter by user |
| page | integer | Page number |
| per_page | integer | Items per page |

---

## Activity Logs

### List Activity Logs

```http
GET /api/v1/activity-logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | integer | Filter by user |
| action | string | Filter by action type |
| module | string | Filter by module |
| from_date | date | Start date |
| to_date | date | End date |
| search | string | Search term |
| page | integer | Page number |
| per_page | integer | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": "log_xyz789",
      "user_id": 1,
      "user_name": "John Doe",
      "action": "update",
      "module": "user_management",
      "resource_type": "User",
      "resource_id": 5,
      "resource_name": "Jane Doe",
      "ip_address": "192.168.1.100",
      "old_values": { "role": "clerk" },
      "new_values": { "role": "admin" },
      "created_at": "2026-01-03T14:30:00Z"
    }
  ]
}
```

### Export Activity Logs

```http
GET /api/v1/activity-logs/export
```

**Query Parameters:**
Same as list, plus:
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | Export format (csv/xlsx) |

**Response:** Binary file download

---

## Permission Logs

### List Permission Changes

```http
GET /api/v1/permission-logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| target_user_id | integer | Filter by affected user |
| changed_by_id | integer | Filter by who made change |
| change_type | string | grant/revoke/modify |
| module | string | Filter by module |
| from_date | date | Start date |
| to_date | date | End date |
| page | integer | Page number |
| per_page | integer | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": "perm_abc123",
      "target_user_id": 5,
      "target_user_name": "Jane Doe",
      "changed_by_id": 1,
      "changed_by_name": "Admin User",
      "change_type": "grant",
      "module": "expense",
      "action": "approve",
      "old_value": null,
      "new_value": true,
      "reason": "Promoted to supervisor",
      "ip_address": "192.168.1.100",
      "created_at": "2026-01-03T10:00:00Z"
    }
  ]
}
```

### Export Permission Logs

```http
GET /api/v1/permission-logs/export
```

---

## Reports

### List Generated Reports

```http
GET /api/v1/reports
```

### Generate Report

```http
POST /api/v1/reports/generate
```

**Request Body:**
```json
{
  "type": "user_access",
  "parameters": {
    "include_inactive": false,
    "role": "all"
  },
  "format": "csv"
}
```

**Report Types:**
- `user_access`
- `permission_changes`
- `login_activity`
- `security_events`
- `compliance_summary`

### Get Report

```http
GET /api/v1/reports/{id}
```

### Download Report

```http
GET /api/v1/reports/{id}/download
```

### Delete Report

```http
DELETE /api/v1/reports/{id}
```

---

## Gate Pass

### List Gate Passes

```http
GET /api/v1/gate-pass
```

**Permission:** `gate_pass.read`

### Create Gate Pass

```http
POST /api/v1/gate-pass/visitor
```

**Permission:** `gate_pass.create`

### Validate Gate Pass

```http
POST /api/v1/gate-pass/{id}/validate
```

**Permission:** `gate_pass.validate`

### Approve Gate Pass

```http
POST /api/v1/gate-pass/{id}/approve
```

**Permission:** `gate_pass.approve`

---

## Expenses

### List Expenses

```http
GET /api/v1/expenses
```

**Permission:** `expense.read`

### Create Expense

```http
POST /api/v1/expenses
```

**Permission:** `expense.create`

### Approve Expense

```http
POST /api/v1/expenses/{id}/approve
```

**Permission:** `expense.approve`

---

## Inspections

### List Inspections

```http
GET /api/v1/inspections
```

**Permission:** `inspection.read`

### Create Inspection

```http
POST /api/v1/inspections
```

**Permission:** `inspection.create`

### Approve Inspection

```http
POST /api/v1/inspections/{id}/approve
```

**Permission:** `inspection.approve`

---

## Rate Limiting

API requests are rate limited:
- **Authenticated:** 1000 requests per minute
- **Unauthenticated:** 60 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704307200
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /api/v1/users?page=2&per_page=25
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "current_page": 2,
    "per_page": 25,
    "total": 150,
    "last_page": 6
  },
  "links": {
    "next": "/api/v1/users?page=3&per_page=25",
    "prev": "/api/v1/users?page=1&per_page=25"
  }
}
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- User management endpoints
- Permission system
- Session management
- Security features
- Activity logging
- Report generation





