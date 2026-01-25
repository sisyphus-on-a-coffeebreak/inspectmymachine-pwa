# VOMS User Guide - Complete Employee Handbook

**Version:** 2.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Your Role](#understanding-your-role)
3. [Gate Pass Management](#gate-pass-management)
4. [Expense Management](#expense-management)
5. [Vehicle Inspections](#vehicle-inspections)
6. [Approvals & Workflows](#approvals--workflows)
7. [Dashboard & Navigation](#dashboard--navigation)
8. [Mobile Features](#mobile-features)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Login

1. **Access the Application**
   - Open your web browser or mobile app
   - Navigate to: `https://inspectmymachine.in`
   - Enter your email and password provided by your administrator

2. **Change Your Password** (if required)
   - On first login, you may be prompted to change your password
   - Choose a strong password (minimum 8 characters)
   - Save your password securely

3. **Explore the Dashboard**
   - After login, you'll see your personalized dashboard
   - The dashboard shows:
     - Pending approvals (if you have approval rights)
     - Recent activity
     - Quick action buttons
     - Statistics relevant to your role

### Understanding the Interface

**Main Navigation:**
- **Sidebar Menu**: Access all modules (visible on desktop)
- **Bottom Navigation**: Quick access on mobile devices
- **Top Bar**: Search, notifications, profile menu
- **Dashboard**: Your home screen with overview

**Color Indicators:**
- 🟢 **Green**: Success, completed, active
- 🟡 **Yellow**: Warning, pending, needs attention
- 🔴 **Red**: Error, rejected, urgent
- 🔵 **Blue**: Information, in progress

---

## Understanding Your Role

Your role determines what you can see and do in the system. Here's what each role can do:

### 👤 **Clerk**
**What you can do:**
- Create visitor passes
- Create vehicle passes (inbound/outbound)
- Create expense requests
- View your own passes and expenses
- Submit items for approval

**What you cannot do:**
- Approve passes or expenses
- Validate passes at gate
- Access admin features

**Quick Actions:**
- Create Pass (Ctrl+N)
- Create Expense (Ctrl+Shift+E)
- View My Passes

### 🛡️ **Guard**
**What you can do:**
- Scan QR codes to validate passes
- View expected arrivals
- View currently inside vehicles/visitors
- Record entry/exit
- View pass history

**What you cannot do:**
- Create passes
- Approve passes
- Access reports

**Quick Actions:**
- Scan QR Code
- View Expected Arrivals
- View Inside Now

### 👔 **Executive**
**What you can do:**
- Create visitor and vehicle passes
- Create expense requests
- Validate passes (if granted permission)
- View reports

**What you cannot do:**
- Approve passes or expenses
- Access admin features

**Quick Actions:**
- Create Visitor Pass (Ctrl+Shift+V)
- Create Vehicle Pass (Ctrl+Shift+C)
- Create Expense (Ctrl+Shift+E)

### 👨‍💼 **Supervisor**
**What you can do:**
- Approve passes and expenses
- Validate passes at gate
- View all passes and expenses
- Access reports and analytics
- View alerts and urgent items

**What you cannot do:**
- Create users
- Manage permissions
- Access admin settings

**Quick Actions:**
- Approvals Dashboard
- Alerts
- Gate Passes

### 🏭 **Yard In-charge**
**What you can do:**
- Create passes
- Approve passes
- Validate passes
- Manage inventory
- View movements
- Access reports

**What you cannot do:**
- Manage users
- Access admin settings

### 👨‍🔧 **Inspector**
**What you can do:**
- Create vehicle inspections
- View inspection history
- Generate inspection reports
- Create expense requests

**What you cannot do:**
- Create or approve passes
- Access admin features

**Quick Actions:**
- New Inspection
- My Inspections
- Inspection History

### 👑 **Admin / Super Admin**
**What you can do:**
- Everything (full system access)
- Manage users and permissions
- Configure system settings
- Access all reports and analytics
- Bulk operations

**Quick Actions:**
- All features available
- Bulk Create Passes
- User Management
- Reports & Analytics

---

## Gate Pass Management

### Creating a Visitor Pass

**Who can create:** Clerk, Executive, Admin, Yard In-charge

**Steps:**
1. Navigate to **Stockyard Access** → **Create Pass** (or press `Ctrl+N`)
2. Select **"Visitor Pass"** (or use `Ctrl+Shift+V`)
3. Fill in the required information:
   - **Visitor Name** (required)
   - **Phone Number** (required, 10 digits: 6000000000-9999999999)
   - **Referred By** (required)
   - **Company** (optional)
   - **Purpose** (required): Inspection, Service, Delivery, Meeting, or Other
   - **Vehicles to View** (optional): Select vehicles visitor can view
   - **Valid From/To** (required): Set validity period
   - **Notes** (optional)

4. Click **"Create Pass"**
5. The pass will be:
   - **Auto-approved** if you have auto-approval permission
   - **Submitted for approval** if you don't have auto-approval

**After Creation:**
- You'll be automatically taken to the pass details page
- You can download the PDF pass
- Share the pass via WhatsApp/Email
- View the QR code

### Creating a Vehicle Outbound Pass

**Who can create:** Clerk, Executive, Admin, Yard In-charge

**Steps:**
1. Navigate to **Stockyard Access** → **Create Pass** (or press `Ctrl+N`)
2. Select **"Vehicle Going Out"** (or use `Ctrl+Shift+C`)
3. **Select Vehicle from Yard** (required):
   - Only vehicles currently in the yard are shown
   - Search by registration number, make, or model
   - Recent vehicles appear at the top
4. Fill in driver details:
   - **Driver Name** (required)
   - **Driver Contact** (required, 10 digits: 6000000000-9999999999)
5. Fill in trip details:
   - **Purpose** (required): RTO Work, Sold, Test Drive, Service, Auction, or Other
   - **Destination** (optional)
   - **Expected Return Date/Time** (optional)
6. Set validity period (required)
7. Add notes if needed
8. Click **"Create Pass"**

**Important Notes:**
- Only vehicles currently in the yard can be selected
- The vehicle will be marked as "outbound" when the pass is created
- The pass must be validated at the gate before the vehicle can leave

### Creating a Vehicle Inbound Pass

**Who can create:** Clerk, Executive, Admin, Yard In-charge

**Steps:**
1. Navigate to **Stockyard Access** → **Create Pass**
2. Select **"Vehicle Coming In"**
3. **Search or Create Vehicle**:
   - Enter registration number
   - If vehicle exists, it will be selected
   - If not found, you can create a new vehicle record
4. Fill in vehicle details (if creating new):
   - Registration Number (required)
   - Make, Model, Year (optional)
5. Fill in driver and employee information:
   - **Driver Name** (required)
   - **Driver Contact** (required)
   - **Employee who brought it** (for accountability)
6. Fill in purpose and validity
7. Add condition notes (broken parts, batteries, components, etc.)
8. Click **"Create Pass"**

### Bulk Pass Creation

**Who can use:** Admin, Super Admin

**Steps:**
1. Navigate to **Stockyard Access** → **Bulk Create** (or click "Bulk Create" button on dashboard)
2. Select **Pass Type**: Visitor, Vehicle Inbound, or Vehicle Outbound
3. Use the spreadsheet-like grid:
   - **Add Row**: Click "Add Row" button
   - **Manual Entry**: Type directly into cells
   - **Copy-Paste**: Copy from Excel/Google Sheets and paste (Ctrl+V)
   - **Tab Navigation**: Use Tab key to move between cells
4. Fill in required fields:
   - For **Visitor**: Name, Phone, Referred By, Purpose, Valid From/To
   - For **Vehicle Outbound**: Select Vehicle (dropdown), Driver Name, Driver Contact, Purpose, Valid From/To
   - For **Vehicle Inbound**: Registration, Driver Name, Purpose, Valid From/To
5. **Validation**:
   - Each row is validated in real-time
   - Green row = Valid
   - Red row = Has errors (hover to see error message)
   - Check validation summary at top
6. **Submit**:
   - Click "Submit X Passes" button
   - Only valid rows will be submitted
   - You'll see success/failure count

**Tips:**
- Phone numbers must be 10 digits between 6000000000-9999999999
- Purpose is a dropdown - select from available options
- For vehicle outbound, you must select from vehicles in yard
- Use "Duplicate Row" to copy a row
- Use "Clear All" to start fresh

### Viewing Passes

**All Roles:**
1. Navigate to **Stockyard Access** (main dashboard)
2. Use filters:
   - **Status**: All, Pending, Active, Inside, Completed, Expired
   - **Type**: All, Visitor, Vehicle
   - **Search**: By pass number, visitor name, vehicle registration
   - **Date Range**: Today, This Week, This Month, Custom
3. Click on any pass card to view details

**Pass Details Page Shows:**
- Pass number and type badge
- Visitor/Vehicle information
- Purpose and validity period
- Current status
- QR code (for scanning)
- Entry/Exit history
- Approval status
- Actions: Download PDF, Share, Mark Exit (if applicable)

### Validating Passes (Guards)

**Who can validate:** Guard, Supervisor, Admin, Yard In-charge

**Method 1: Quick Scan**
1. Navigate to **Stockyard Access** → **Scan** (or use guard dashboard)
2. Click **"Scan QR Code"** button
3. Allow camera access
4. Point camera at QR code
5. Pass details will appear automatically
6. Click **"Record Entry"** or **"Record Exit"**

**Method 2: Manual Entry**
1. Navigate to **Stockyard Access** → **Scan**
2. Click **"Manual Entry"**
3. Enter pass number or scan code
4. View pass details
5. Record entry/exit

**Method 3: Guard Register**
1. Navigate to **Stockyard Access** → **Guard Register**
2. View **"Expected Arrivals"** section
3. Click on a pass to validate
4. Confirm entry/exit

**What Happens When You Validate:**
- A **Movement** record is created
- Pass status updates (Pending → Active → Inside → Completed)
- Entry/Exit time is recorded
- Guard information is logged
- Notification sent to relevant parties

### Pass Statuses Explained

- **Pending**: Created but not yet approved
- **Active**: Approved and valid, not yet used
- **Inside**: Currently inside the yard (entry recorded)
- **Completed**: Exit recorded, pass closed
- **Expired**: Validity period ended
- **Rejected**: Approval was rejected
- **Cancelled**: Pass was cancelled

---

## Expense Management

### Creating an Expense Request

**Who can create:** Clerk, Executive, Inspector, Admin

**Steps:**
1. Navigate to **Expenses** → **Create Expense** (or press `Ctrl+Shift+E`)
2. Fill in expense details:
   - **Amount** (required)
   - **Category** (required): Travel, Food, Supplies, etc.
   - **Description** (required)
   - **Date** (required)
   - **Project/Asset** (optional): Link to project or asset
3. Upload receipts (optional):
   - Click "Upload Receipt"
   - Take photo or select from gallery
   - Multiple receipts supported
4. Add notes if needed
5. Click **"Submit for Approval"**

**After Submission:**
- Expense is submitted for approval
- If you have auto-approval permission, it's approved immediately
- Otherwise, approvers will be notified
- You can track status in "My Expenses"

### Viewing Expenses

1. Navigate to **Expenses**
2. Use filters:
   - **Status**: All, Pending, Approved, Rejected
   - **Category**: Filter by expense category
   - **Date Range**: Filter by date
   - **Search**: By description or amount
3. Click on expense card to view details

**Expense Details Show:**
- Amount and category
- Description and date
- Receipts (if uploaded)
- Approval status and history
- Approver comments
- Actions: Edit (if pending), Download Receipts

### Approving Expenses

**Who can approve:** Supervisor, Admin, Yard In-charge (if granted permission)

**Method 1: Approvals Dashboard**
1. Navigate to **Approvals** (or click approval badge on dashboard)
2. Filter by **"Expenses"** tab
3. Review expense details
4. Click **"Approve"** or **"Reject"**
5. Add comments if rejecting

**Method 2: Bulk Approval**
1. Navigate to **Approvals**
2. Select multiple expenses (checkboxes)
3. Click **"Approve Selected"** or **"Reject Selected"**
4. Add comments if needed

**Method 3: Swipe Gestures (Mobile)**
- Swipe right on expense card to approve
- Swipe left to reject

**Keyboard Shortcut:**
- Press `Ctrl+A` to select all pending items

---

## Vehicle Inspections

### Creating an Inspection

**Who can create:** Inspector, Admin

**Steps:**
1. Navigate to **Inspections** → **New Inspection** (or use FAB button on mobile)
2. Select vehicle:
   - Search by registration number
   - Or select from recent vehicles
3. Choose inspection template (if multiple available)
4. Fill in inspection form:
   - Answer all questions (130+ questions)
   - Take photos where required
   - Add notes for defects
   - Record measurements
5. Complete all sections
6. Review summary
7. Click **"Submit Inspection"**

**Inspection Features:**
- **Offline Support**: Work without internet, syncs when online
- **Photo Capture**: Take photos directly in the app
- **Signature**: Digital signature for completion
- **Auto-save**: Progress is saved automatically
- **PDF Report**: Generate professional PDF report

### Viewing Inspections

1. Navigate to **Inspections**
2. Filter by:
   - **Status**: All, In Progress, Completed, Approved
   - **Vehicle**: Search by registration
   - **Date Range**: Filter by inspection date
   - **Inspector**: View your inspections or all
3. Click on inspection to view details

**Inspection Details Show:**
- Vehicle information
- All inspection answers
- Photos and notes
- Inspector information
- Approval status
- PDF report (downloadable)

---

## Approvals & Workflows

### Understanding Approvals

**What Needs Approval:**
- Gate Passes (if creator doesn't have auto-approval)
- Expense Requests (if creator doesn't have auto-approval)
- Some inspections (depending on configuration)

**Who Can Approve:**
- Depends on your role and permissions
- Check with your administrator if unsure

### Approvals Dashboard

**Access:** Click the **"Approvals"** button on dashboard (shows badge with count)

**Features:**
- **Unified View**: See all pending approvals in one place
- **Filter by Type**: Gate Passes, Expenses, Transfers
- **Search**: Find specific items
- **Bulk Actions**: Select multiple items to approve/reject
- **Quick Actions**: Approve/Reject with one click

**Approving Items:**
1. Review the item details
2. Click **"Approve"** or **"Reject"**
3. Add comments if rejecting
4. Confirm action

**Bulk Approval:**
1. Select items using checkboxes
2. Click **"Select All"** (or press `Ctrl+A`)
3. Click **"Approve Selected"** or **"Reject Selected"**
4. Add comments if needed

**Mobile Swipe Gestures:**
- **Swipe Right**: Approve
- **Swipe Left**: Reject

### Auto-Approval

**What is Auto-Approval?**
- If you have auto-approval permission, items you create are automatically approved
- No need to wait for approval
- Saves time and speeds up workflow

**How to Know if You Have It:**
- Items you create show "Active" or "Approved" status immediately
- No approval badge appears
- Check with administrator if unsure

---

## Dashboard & Navigation

### Dashboard Overview

**Your dashboard shows:**
- **Pending Approvals**: Items waiting for your approval (if you're an approver)
- **Today's Activity**: Summary of today's work
- **Quick Actions**: Fast access to common tasks
- **Statistics**: Relevant stats for your role
- **Recent Items**: Latest passes, expenses, inspections

**Role-Specific Dashboards:**
- **Guard**: Expected arrivals, currently inside, quick scan
- **Clerk**: Create pass, create expense, view passes
- **Supervisor**: Approvals, alerts, gate passes
- **Admin**: All features, bulk operations, reports

### Navigation

**Desktop:**
- **Sidebar Menu**: Always visible on left
- **Top Bar**: Search, notifications, profile
- **Breadcrumbs**: Shows your current location

**Mobile:**
- **Bottom Navigation**: Quick access to main sections
- **FAB (Floating Action Button)**: Quick create actions
- **Hamburger Menu**: Full menu access

**Quick Navigation:**
- Use search bar to find anything
- Click module cards on dashboard
- Use keyboard shortcuts (see below)

### Search

**Global Search:**
- Click search icon in top bar
- Type to search across:
  - Passes (by number, visitor name, vehicle)
  - Expenses (by description, amount)
  - Inspections (by vehicle, inspector)
  - Users (by name, email)

**Filtered Search:**
- Within each module, use search bar
- Filters are context-specific
- Combine multiple filters for precise results

---

## Mobile Features

### Installing as PWA

**Android:**
1. Open in Chrome browser
2. Tap menu (three dots)
3. Select "Add to Home Screen"
4. App icon appears on home screen

**iOS:**
1. Open in Safari browser
2. Tap Share button
3. Select "Add to Home Screen"
4. App icon appears on home screen

### Mobile-Specific Features

**Offline Support:**
- App works without internet
- Data syncs when connection restored
- Inspections can be completed offline

**Camera Integration:**
- Take photos directly in app
- No need to upload from gallery
- Works for receipts, inspection photos, vehicle photos

**Touch Gestures:**
- **Swipe Right**: Approve (in approvals)
- **Swipe Left**: Reject (in approvals)
- **Pull to Refresh**: Refresh data
- **Swipe to Delete**: Remove items (where applicable)

**Mobile Optimizations:**
- Large touch targets
- Optimized forms for mobile
- Smart keyboard handling
- Haptic feedback on actions

---

## Keyboard Shortcuts

**Global Shortcuts:**
- `Ctrl+N` / `Cmd+N`: Create new pass
- `Ctrl+Shift+V` / `Cmd+Shift+V`: Create visitor pass
- `Ctrl+Shift+C` / `Cmd+Shift+C`: Create vehicle pass
- `Ctrl+Shift+E` / `Cmd+Shift+E`: Create expense
- `Ctrl+A` / `Cmd+A`: Select all (in approvals)
- `?`: Show help / keyboard shortcuts
- `Esc`: Close modal / cancel action

**Navigation:**
- Use Tab to move between form fields
- Enter to submit forms
- Arrow keys to navigate lists

**Tips:**
- Shortcuts work on desktop/laptop
- Some shortcuts work on mobile with external keyboard
- Hover over buttons to see tooltips with shortcuts

---

## Troubleshooting

### Common Issues

**"I can't log in"**
1. Check your email and password
2. Ensure Caps Lock is off
3. Check if account is locked (contact admin)
4. Try resetting password
5. Clear browser cache and cookies

**"I can't see a feature"**
1. Check your role and permissions
2. Contact administrator to grant access
3. Refresh the page
4. Log out and log back in

**"Pass/Expense not showing"**
1. Check filters (status, date range)
2. Clear filters and search again
3. Check if item was deleted
4. Refresh the page

**"QR code not scanning"**
1. Ensure good lighting
2. Hold phone steady
3. Clean camera lens
4. Try manual entry instead
5. Check if pass is expired or cancelled

**"Can't upload photo"**
1. Check camera permissions
2. Ensure good internet connection
3. Try smaller image size
4. Use mobile app instead of browser

**"App is slow"**
1. Check internet connection
2. Clear browser cache
3. Close other tabs/apps
4. Restart browser/app
5. Check if server is down

**"Data not syncing"**
1. Check internet connection
2. Wait a few seconds and refresh
3. Log out and log back in
4. Clear app cache (mobile)
5. Contact support if persists

### Getting Help

**Contact Your Administrator:**
- For permission issues
- For account problems
- For feature requests
- For technical support

**Self-Service:**
- Check this user guide
- Use in-app help (press `?`)
- Review error messages carefully
- Check notification center for alerts

**Emergency:**
- If system is down, contact IT support
- For urgent gate pass issues, use manual process
- Document any workarounds used

---

## Best Practices

### Creating Passes
- ✅ Fill in all required fields accurately
- ✅ Double-check phone numbers (10 digits)
- ✅ Set appropriate validity periods
- ✅ Add notes for special instructions
- ✅ Verify vehicle selection for outbound passes

### Managing Expenses
- ✅ Upload clear receipt photos
- ✅ Provide detailed descriptions
- ✅ Categorize correctly
- ✅ Submit promptly after expense
- ✅ Keep receipts for your records

### Approvals
- ✅ Review all details before approving
- ✅ Add comments when rejecting
- ✅ Process approvals promptly
- ✅ Use bulk approval for efficiency
- ✅ Check for urgent items first

### Security
- ✅ Never share your password
- ✅ Log out when done (especially on shared devices)
- ✅ Report suspicious activity
- ✅ Keep app updated
- ✅ Use strong passwords

---

## Quick Reference

### Common Tasks

| Task | Path | Shortcut |
|------|------|----------|
| Create Visitor Pass | Stockyard Access → Create → Visitor | `Ctrl+Shift+V` |
| Create Vehicle Pass | Stockyard Access → Create → Vehicle | `Ctrl+Shift+C` |
| Create Expense | Expenses → Create | `Ctrl+Shift+E` |
| View Approvals | Approvals | Click badge |
| Scan QR Code | Stockyard Access → Scan | Guard dashboard |
| View My Passes | Stockyard Access → Filter: Mine | - |
| View My Expenses | Expenses → Filter: Mine | - |
| Bulk Create Passes | Stockyard Access → Bulk Create | Admin only |

### Status Meanings

| Status | Meaning | Action Needed |
|--------|---------|---------------|
| Pending | Waiting for approval | Approver: Review and approve/reject |
| Active | Approved and valid | Ready to use |
| Inside | Currently in yard | Guard: Record exit when leaving |
| Completed | Pass closed | No action needed |
| Expired | Validity ended | No action needed |
| Rejected | Approval denied | Creator: Review rejection reason |

### Phone Number Format
- **Required**: Exactly 10 digits
- **Range**: 6000000000 to 9999999999
- **Format**: Enter digits only (no spaces, dashes, or country code)
- **Example**: `9876543210` ✅ | `+91 9876543210` ❌

---

## Appendix

### Role Capabilities Summary

| Role | Create Passes | Approve Passes | Validate Passes | Create Expenses | Approve Expenses | Inspections |
|------|---------------|----------------|------------------|-----------------|------------------|-------------|
| Clerk | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Guard | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Executive | ✅ | ❌ | ✅* | ✅ | ❌ | ❌ |
| Supervisor | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Yard In-charge | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Inspector | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*If granted permission

### Pass Types Explained

**Visitor Pass:**
- For external visitors (clients, inspectors, etc.)
- Can view specific vehicles (optional)
- Valid for specified time period
- Requires approval (unless auto-approved)

**Vehicle Outbound:**
- For vehicles leaving the yard
- Must select from vehicles currently in yard
- Tracks driver and destination
- Creates movement record on validation

**Vehicle Inbound:**
- For vehicles entering the yard
- Can search existing or create new vehicle
- Tracks condition and components
- Creates movement record on validation

---

**End of User Guide**

For technical documentation, see:
- `DEVELOPER_GUIDE.md` - For developers
- `API_REFERENCE.md` - For API integration
- `DEPLOYMENT_GUIDE.md` - For deployment
- `ADMIN_USER_GUIDE.md` - For administrators


