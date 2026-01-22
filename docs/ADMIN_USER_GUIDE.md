# VOMS Admin User Guide

## Table of Contents

1. [Overview](#overview)
2. [User Management](#user-management)
3. [Permission Management](#permission-management)
4. [Security Features](#security-features)
5. [Audit & Compliance](#audit--compliance)
6. [Reports](#reports)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers administrative features available to users with **Admin** or **Super Admin** roles.

### Accessing Admin Features

1. Log in with an Admin or Super Admin account
2. Navigate to the Admin section via the sidebar menu
3. Available features depend on your role level

### Role Hierarchy

| Role | Access Level |
|------|--------------|
| Super Admin | Full access to all features |
| Admin | Access to most admin features |
| Inspector | Inspection and limited admin access |
| Guard | Gate pass validation only |
| Clerk | Data entry and basic viewing |

---

## User Management

**Path:** Admin → Users (`/app/admin/users`)

### Viewing Users

The user list displays:
- User name and email
- Role badge
- Status (Active/Inactive)
- Last login time

**Features:**
- **Search**: Type in the search box to find users by name or email
- **Filter by Role**: Use the dropdown to show only specific roles
- **Filter by Status**: Toggle between active, inactive, or all users
- **Pagination**: Navigate through pages or change items per page

### Creating a New User

1. Click **"Create User"** button (requires `user_management.create` permission)
2. Fill in the required fields:
   - Name
   - Email
   - Employee ID
   - Role
   - Phone (optional)
3. Set initial password or generate temporary one
4. Click **"Create"**

### Editing a User

1. Find the user in the list
2. Click the **"Edit"** button (requires `user_management.update` permission)
3. Modify the fields as needed
4. Click **"Save Changes"**

### Deactivating/Reactivating a User

1. Click **"Edit"** on the user
2. Toggle the **"Active"** switch
3. Save changes

**Note:** Deactivating a user immediately terminates all their active sessions.

### Deleting a User

1. Click the **"Delete"** button (requires `user_management.delete` permission)
2. Type "DELETE" to confirm
3. Click **"Confirm Delete"**

⚠️ **Warning:** Deleting a user is permanent and cannot be undone.

### Resetting User Password

1. Click **"Reset Password"** on the user row
2. Choose to:
   - Generate a temporary password
   - Set a specific password
3. The user will be required to change their password on next login

---

## Permission Management

### Understanding Capabilities

VOMS uses a capability-based permission system:

| Module | Available Actions |
|--------|-------------------|
| `user_management` | create, read, update, delete |
| `gate_pass` | create, read, update, delete, approve, validate |
| `expense` | create, read, update, delete, approve, reassign |
| `inspection` | create, read, update, delete, approve, review |
| `reports` | read, export |

### Permission Templates

**Path:** Admin → Permission Templates (`/app/admin/permission-templates`)

Templates allow you to quickly assign a predefined set of permissions to users.

**Creating a Template:**
1. Click **"New Template"**
2. Enter template name and description
3. Select the capabilities to include
4. Save the template

**Applying a Template:**
1. Edit a user
2. Click **"Apply Template"**
3. Select the template
4. Review changes and confirm

### Capability Matrix

**Path:** Admin → Capability Matrix (`/app/admin/capability-matrix`)

View and manage permissions across all users in a matrix view.

**Features:**
- Toggle individual capabilities
- Bulk assign/revoke permissions
- Filter by module or role
- See permission source (role-based vs direct)

### Enhanced Capabilities

Enhanced capabilities are temporary elevated permissions:

- Can have expiration dates
- Can have scope restrictions (e.g., specific yards only)
- Can have time-based restrictions (e.g., working hours only)

**Granting Enhanced Capability:**
1. Edit a user
2. Go to **"Enhanced Capabilities"** section
3. Click **"Add Enhanced Capability"**
4. Select module and action
5. Set expiration date (optional)
6. Provide reason for granting
7. Save

---

## Security Features

### Security Dashboard

**Path:** Admin → Security (`/app/admin/security`)

The security dashboard provides an overview of:

- **Active Sessions**: Number of currently logged-in users
- **Failed Logins (24h)**: Recent failed login attempts
- **Locked Accounts**: Users locked due to failed attempts
- **New Devices**: Logins from previously unknown devices

### Managing Failed Login Attempts

When a user exceeds the maximum failed login attempts:
1. Their account is automatically locked
2. They appear in the **"Locked Accounts"** section
3. An admin can unlock them manually

**To Unlock an Account:**
1. Go to Security Dashboard
2. Find the user in **"Locked Accounts"**
3. Click **"Unlock"**
4. Confirm the action

### Session Management

**Path:** Settings → Sessions (`/app/settings/sessions`)

Users can manage their own sessions:
- View all active sessions across devices
- See device, browser, and location info
- Terminate individual sessions
- Terminate all other sessions

**Admin Session Management:**
Admins can view and terminate sessions for any user from the user edit page.

### Security Events

The security dashboard shows recent security events:
- Login successes and failures
- Password changes
- Account locks/unlocks
- Permission denials
- Suspicious activities

---

## Audit & Compliance

### Permission Change Logs

**Path:** Admin → Permission Logs (`/app/admin/permission-logs`)

Track all permission changes:
- Who made the change
- What was changed
- When it was changed
- Before/after values

**Filtering Options:**
- By change type (grant, revoke, modify)
- By date range
- By user

**Exporting:**
Click **"Export"** to download logs as CSV.

### Activity Logs

**Path:** Admin → Activity Logs (`/app/admin/activity-logs`)

View all user activity:
- User actions (create, update, delete)
- Resource affected
- Timestamp
- IP address

**Expandable Details:**
Click any row to see full details including:
- Old and new values for updates
- User agent information
- Additional context

### Compliance Dashboard

**Path:** Admin → Compliance (`/app/admin/compliance`)

Overview of compliance status:

**Compliance Score (0-100):**
- 90-100: Excellent
- 70-89: Good, some attention needed
- Below 70: Requires immediate action

**Score Factors:**
- Locked accounts reduce score
- Excessive failed logins reduce score
- Missing security configurations reduce score

**Checklist Items:**
- Password policy enforced
- Session timeout configured
- Activity logging enabled
- Permission changes tracked
- No locked accounts
- Failed login alerts configured

---

## Reports

### Audit Reports

**Path:** Admin → Audit Reports (`/app/admin/audit-reports`)

Generate compliance reports:

| Report Type | Description |
|-------------|-------------|
| User Access Report | Summary of all user permissions |
| Permission Changes | History of permission modifications |
| Login Activity | User login/logout history |
| Security Events | Security incidents and alerts |
| Compliance Summary | Overall compliance status |

**Generating a Report:**
1. Click on the report type card
2. Configure parameters (date range, filters)
3. Click **"Generate Report"**
4. Wait for generation to complete
5. Download the report

**Report Formats:**
- CSV (default)
- Excel (XLSX)
- PDF

### Report History

Previously generated reports are saved:
- View status (pending, generating, completed, failed)
- Download completed reports
- Delete old reports

---

## Troubleshooting

### User Cannot Log In

1. **Check if account is locked:**
   - Go to Security Dashboard
   - Look in "Locked Accounts"
   - Unlock if necessary

2. **Check if account is active:**
   - Go to User Management
   - Find the user
   - Ensure "Active" is enabled

3. **Reset password:**
   - Click "Reset Password" on user row
   - Provide new temporary password

### User Cannot Access a Feature

1. **Check user role:**
   - Some features require specific roles

2. **Check capabilities:**
   - Edit user and review permissions
   - Ensure required capability is granted

3. **Check enhanced capabilities:**
   - May have expired
   - May have time restrictions

### Session Issues

1. **Clear all sessions:**
   - User can do this from Settings → Sessions
   - Admin can terminate from user edit page

2. **Force logout:**
   - Terminate all sessions for the user
   - User will need to log in again

### Permission Denied Errors

When users see "Permission Denied":

1. Check the error message for required capability
2. Grant the capability if appropriate
3. Document the reason in permission logs

### Audit Log Issues

If activity logs are missing:

1. Verify logging is enabled
2. Check date range filters
3. Ensure user has permission to view logs

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show help |
| `Esc` | Close modal |
| `Enter` | Confirm action |

### Common Actions

| Task | Path |
|------|------|
| Create user | Admin → Users → Create User |
| Reset password | Admin → Users → [User] → Reset Password |
| Grant permission | Admin → Users → [User] → Edit → Capabilities |
| View security events | Admin → Security |
| Generate report | Admin → Audit Reports |
| View login history | Admin → Activity Logs |

### Getting Help

For additional support:
- Contact your system administrator
- Review the developer documentation
- Check the API reference for technical details





