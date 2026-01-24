# Requirements Analysis Based on Function Clarifications

This document analyzes the requirements from FUNCTION_CLARIFICATION_QUESTIONS.md and provides implementation guidance.

## 1. Stockyard Access Control (Gate Passes)

### Key Requirements

#### 1.1 Employee QR Codes
**Requirement:** Employees should have a "My QR Code" button in their profile that generates a different QR code each time it's opened. The QR code should be validatable by guards and identify which employee it belongs to.

**Current State:** 
- Gate pass QR codes exist for visitor/vehicle passes
- Employee-specific QR codes not implemented

**Implementation Needed:**
- Add "My QR Code" feature to user profile
- Generate time-based or session-based QR codes for employees
- QR payload should include employee ID and timestamp
- Guard validation should identify employee from QR scan

#### 1.2 Vehicle Pass Types
**Requirement:** 
- **Inbound:** Must capture driver and employee info for accountability. Must support inventory/clerking (broken glasses, batteries, components, condition at entry)
- **Outbound:** Simpler - just track what's leaving and with whom
- Vehicle cannot have both inbound and outbound pass active simultaneously
- History/log of all entry/exit like a bank statement (debit/credit = in/out)

**Current State:**
- Basic inbound/outbound distinction exists
- Inventory/clerking features may need enhancement

**Implementation Needed:**
- Enhance inbound pass creation to capture detailed condition/inventory
- Ensure mutual exclusivity of inbound/outbound passes
- Implement comprehensive movement ledger/history

#### 1.3 Approval Workflow
**Requirement:**
- Approval rights managed through user capability matrix (not hardcoded roles)
- Vehicle passes: Only superadmin can approve
- Visitor passes: Anyone with approval permission can approve
- If guard scans unapproved pass: Alert sent to approvers who can approve/reject on the spot

**Current State:**
- Permission system exists but may need verification
- Alert mechanism for unapproved scans needs implementation

**Implementation Needed:**
- Verify capability matrix controls approval permissions
- Implement real-time alerts when guard scans unapproved pass
- Quick approval/rejection interface for guards

#### 1.4 QR Code & Validation
**Requirement:**
- QR codes should work offline (recommendation)
- QR codes become invalid when pass expires
- Guards should be able to manually override validation if QR scan fails

**Current State:**
- QR code generation exists
- Offline validation may need enhancement
- Manual override mechanism needed

**Implementation Needed:**
- Implement offline QR validation (cached validation data)
- Ensure QR codes expire with pass expiry
- Add manual override option for guards with proper logging

#### 1.5 Entry/Exit Recording
**Requirement:**
- Entry: Automatic time and guard name (from profile)
- Exit: Recommend odometer, photos, signatures
- Retroactive entry/exit recording should be possible

**Current State:**
- Basic entry/exit recording exists
- May need enhancement for exit requirements

**Implementation Needed:**
- Ensure automatic guard name and timestamp capture
- Add optional exit fields (odometer, photos, signatures)
- Implement retroactive recording with proper permissions

#### 1.6 Pass Status & Lifecycle
**Requirement:**
- Statuses: pending, active, inside, exited, expired, cancelled
- Passes can be edited before approval
- Expired passes can be reactivated

**Current State:**
- Most statuses exist
- Reactivation feature may need implementation

**Implementation Needed:**
- Verify all statuses are supported
- Implement expired pass reactivation

#### 1.7 Visitor Management
**Requirement:**
- Frequent visitor status for faster creation (if possible)
- History retained for years (efficient storage)
- No blacklist feature needed currently

**Implementation Needed:**
- Implement frequent visitor detection/flagging
- Optimize history storage for long-term retention
- Consider data archival strategy

#### 1.8 Bulk Operations
**Requirement:**
- Access controlled by permissions (not hardcoded roles)
- No limit on bulk creation
- Same approval rules as individual passes

**Implementation Needed:**
- Verify permission-based access control
- Ensure bulk operations follow same approval workflow

#### 1.9 Reports & Analytics
**Requirement:**
- Track which vehicle visitor came for
- Track time spent at facility
- Exportable reports (PDF, Excel)
- Access controlled by permissions

**Implementation Needed:**
- Enhance analytics to track visitor-vehicle relationships
- Add time tracking for visits
- Ensure export functionality works
- Verify permission-based report access

#### 1.10 Integration & Notifications
**Requirement:**
- Pass creation triggers notifications to approvers
- Entry/exit triggers notifications to pass creator
- No integration with other modules currently

**Implementation Needed:**
- Implement notification system for pass creation
- Implement notification system for entry/exit events
- Ensure notification preferences are configurable

---

## 2. Stockyard Inventory Management

### Key Requirements

#### 2.1 Component Types
**Requirement:**
- Types: Battery, Tyre, Spare Parts, Miscellaneous
- Each type has different fields/attributes
- New types can be added by admins

**Current State:**
- Component types exist (battery, tyre, spare_part)
- May need to add "miscellaneous" type
- Dynamic type creation may need implementation

**Implementation Needed:**
- Add "miscellaneous" component type
- Ensure each type has appropriate fields
- Implement admin interface for adding new component types

#### 2.2 Component Creation
**Requirement:**
- Access controlled by permissions
- Information required varies by component type
- Auto-generate unique identifier (barcode/QR code)

**Current State:**
- Component creation exists
- QR/barcode generation may need verification

**Implementation Needed:**
- Verify permission-based access
- Ensure QR/barcode auto-generation works
- Verify component-specific required fields

#### 2.3 Component Lifecycle
**Requirement:**
- Statuses: Available, In Use, Maintenance, Sold
- Components can be transferred between yards (approval outside app)
- End-of-life: Sold to scrap

**Current State:**
- Component statuses exist but may need "sold" status
- Transfer functionality exists

**Implementation Needed:**
- Add "sold" status
- Ensure transfer workflow is clear
- Implement scrap/sale tracking

#### 2.4 Component Tracking
**Requirement:**
- Components linked to vehicles
- Timeline visible when component moved between vehicles
- Track: Installation date, removal date, usage hours (recommendation)
- Maintenance schedules/reminders

**Current State:**
- Component-vehicle linking exists
- Timeline may need enhancement
- Maintenance reminders may need implementation

**Implementation Needed:**
- Enhance timeline visualization
- Implement usage hours tracking
- Implement maintenance schedule and reminders

#### 2.5 Component Cost & Valuation
**Requirement:**
- Track purchase price
- Include installation/removal labor costs
- No profitability analysis needed

**Current State:**
- Purchase price tracking exists
- Labor cost tracking may need enhancement

**Implementation Needed:**
- Ensure labor costs are tracked separately
- Add labor cost fields to installation/removal events

#### 2.6 Component Health
**Requirement:**
- Health definition depends on component type
- Health scores can be automatic or manual (depends on component)
- Low health: Make it red (visual indicator)

**Implementation Needed:**
- Implement component-specific health calculation
- Add visual indicators for health status
- Support both automatic and manual health scoring

#### 2.7 Component Ledger
**Requirement:**
- Transactions: Purchase, Installation, Removal, Transfer, Sold
- Running balance/quantity (varies by item - batteries are units, oils are litres)
- Question about editing/cancelling entries needs clarification

**Current State:**
- Ledger exists
- May need to verify all transaction types are supported

**Implementation Needed:**
- Verify all transaction types are in ledger
- Ensure proper unit tracking (units vs litres)
- Clarify edit/cancel requirements with user

#### 2.8 Component Search & Filtering
**Requirement:**
- Search by: Serial number, type, location, status
- Advanced filters: Date range, cost range, health score
- Support partial matches, wildcards (recommendation)

**Implementation Needed:**
- Verify search functionality covers all criteria
- Add advanced filtering options
- Implement partial match and wildcard support

#### 2.9 Reporting & Analytics
**Requirement:**
- Reports: Stock levels, valuation, usage trends
- Real-time reports
- Access controlled by permissions

**Implementation Needed:**
- Ensure reports are real-time
- Verify permission-based access
- Add usage trend analytics

---

## 3. Stockyard Movements

### Key Requirements

#### 3.1 Movement Types
**Requirement:**
- Types: Entry, Exit, Transfer, Return
- Components can exit and re-enter (maintenance/transfer) but not if sold
- Different rules for different movement types (needs clarification)

**Current State:**
- Movement types exist
- May need to verify all types are supported

**Implementation Needed:**
- Verify all movement types are implemented
- Ensure proper validation (can't re-enter if sold)
- Clarify movement type-specific rules

#### 3.2 Movement Creation
**Requirement:**
- Access controlled by permissions
- Mandatory: Component, Movement type, Reason, Person responsible
- Approval: Super admin for vehicles, assigned employee for components
- Movement and vehicle entry/exit are the same

**Current State:**
- Movement creation exists
- Approval workflow may need verification

**Implementation Needed:**
- Verify permission-based access
- Ensure approval workflow matches requirements
- Clarify relationship between movements and vehicle passes

#### 3.3 Component vs Vehicle Movement
**Requirement:**
- Distinction between component movement and vehicle movement
- Vehicle movements automatically track component movements
- Multiple components can be moved at once

**Current State:**
- Both types exist
- Auto-tracking may need verification

**Implementation Needed:**
- Verify automatic component tracking on vehicle movement
- Ensure bulk component movement works

#### 3.4 Movement Approval
**Requirement:**
- Vehicles: Superadmin approval
- Components: Assigned employee approval
- Clarify what happens on rejection

**Implementation Needed:**
- Verify approval permissions match requirements
- Clarify rejection workflow

#### 3.5 QR Scanning for Movements
**Requirement:**
- Movements recorded via QR scan at gate (same as vehicle entry/exit)
- Manual creation if QR scan fails (recommendation)
- Capture timestamp and GPS location

**Implementation Needed:**
- Ensure QR scanning works for movements
- Add manual fallback option
- Implement GPS location capture

#### 3.6 Movement History
**Requirement:**
- History retained forever (ideally)
- Searchable history (component ledger)
- Records can be edited/cancelled

**Implementation Needed:**
- Ensure long-term storage strategy
- Verify searchability
- Implement edit/cancel functionality with proper permissions

#### 3.7 Stockyard Requests
**Requirement:**
- **CLARIFIED:** Stockyard requests ARE gate passes
- When a gate pass is scanned at the gate, it automatically creates an entry or exit movement
- Movements must be logically connected to gate passes via `pass_id` (mandatory)
- Complete audit chain: Movement → Scan Event → Gate Pass → Creator → Approver

**Current State:**
- Stockyard requests and gate passes may be separate entities
- Movement creation may not be automatically triggered by gate pass scans
- Connection between movements and gate passes may be missing

**Implementation Needed:**
- **CRITICAL:** Ensure stockyard requests and gate passes are the same entity
- **CRITICAL:** When gate pass is scanned, automatically create:
  1. Scan Event (with pass_id, gate_id, guard_id, timestamp, GPS)
  2. Movement (with pass_id, scan_event_id, gate_id, guard_id - all mandatory)
- Ensure `pass_id` is mandatory in movements table
- Implement entry/exit validation logic:
  - ENTRY: Vehicle must be OUTSIDE before entry
  - EXIT: Vehicle must be INSIDE before exit
- Create complete audit trail linking all entities
- See `PASS_MOVEMENT_ARCHITECTURE.md` for detailed architecture

#### 3.8 Movement Validation
**Requirement:**
- Validate against current inventory (prevent exit if not in stock)
- Validate transfer movements (target yard exists, has capacity)
- Alert on validation failure

**Implementation Needed:**
- Implement inventory validation
- Add transfer validation
- Ensure proper alerting on failures

#### 3.9 Movement Analytics
**Requirement:**
- Metrics: Daily movements, peak times, most moved components
- Unusual pattern alerts (how to identify needs clarification)
- Trend reports over time

**Implementation Needed:**
- Implement movement analytics
- Clarify unusual pattern detection
- Add trend reporting

#### 3.10 Integration
**Requirement:**
- No link to inspections
- Recommend linking to expense tracking
- Trigger notifications to stakeholders

**Implementation Needed:**
- Implement expense tracking integration
- Add notification triggers
- Ensure proper stakeholder notification

---

## Implementation Priority

### High Priority (Core Functionality)
1. **CRITICAL:** Gate Pass ↔ Movement Connection
   - Ensure stockyard requests = gate passes
   - Auto-create movements when gate pass is scanned
   - Mandatory pass_id in movements table
   - Complete audit chain: Movement → Scan Event → Gate Pass → Creator → Approver
2. **CRITICAL:** Entry/Exit Validation Logic
   - ENTRY: Vehicle must be OUTSIDE before entry
   - EXIT: Vehicle must be INSIDE before exit
   - Automatic status updates on scan
3. Employee QR Code feature
4. Enhanced vehicle inbound/outbound tracking
5. Approval workflow based on capability matrix
6. Alert system for unapproved pass scans
7. Component type management (add miscellaneous)
8. Component health tracking and visualization
9. Movement validation and alerts

### Medium Priority (Enhanced Features)
1. Offline QR validation
2. Manual override for QR validation
3. Retroactive entry/exit recording
4. Frequent visitor detection
5. Maintenance schedules and reminders
6. Advanced search and filtering
7. GPS location capture for movements

### Low Priority (Nice to Have)
1. Usage hours tracking
2. Labor cost tracking
3. Unusual pattern detection
4. Trend analytics
5. Data archival strategy

---

## Questions for Clarification

1. **Component Ledger:** Can ledger entries be edited/cancelled after creation?
2. **Stockyard Requests:** ✅ **CLARIFIED** - Stockyard requests ARE gate passes. When scanned, they create movements.
3. **Movement Rules:** What are the different rules for different movement types?
4. **Unusual Patterns:** How should unusual movement patterns be identified?
5. **Component Health:** For which component types should health be automatic vs manual?
6. **Component Movements:** Do component movements also require a gate pass, or only vehicle movements?
7. **Transfer Movements:** Are transfer movements between yards also linked to gate passes?
8. **Manual Entry:** If QR scan fails and guard manually enters, how should scan_event_id be handled?

---

## Next Steps

1. Review this analysis with stakeholders
2. Prioritize implementation items
3. Create detailed implementation tickets
4. Begin with high-priority items
5. Schedule follow-up clarifications for open questions

