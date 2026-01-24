# Function Clarification Questions

This document contains 10 questions for each major function/module to clarify use cases, expectations, and requirements.

---

## 1. Stockyard Access Control (Gate Passes)

### Questions:

1. **Visitor Pass Creation:**
   - Should employees be able to create visitor passes for themselves, or only for external visitors? - I want employee profile to have a button called my qr code that is different every time they open it and can be validated by the gaurd and identified as which employee was it. 
   - What information is mandatory vs optional when creating a visitor pass? - as it is right now
   - Should there be a limit on how many visitor passes an employee can create per day/week? - no

2. **Vehicle Pass Types:**
   - What's the exact difference between "vehicle inbound" and "vehicle outbound" passes?  - I can define the business logic that can be used to infer further - When a vehicle is inbound, we want to know who brought it (driver and employee) in order to maintain accountability as well as prepare to do the inventory/clerking of the vehicle to see what all came with it and what was the condition at the time of entry. this could include things like broken glasses, batteries, other components etc. Outbound is much simpler in which we just have to see what it is leaving with and with who. 
   - Can a vehicle have both an inbound and outbound pass active simultaneously? - No, it is either in the yard or outside it.
   - Should vehicle passes automatically expire after exit, or remain in history? - i would like for there to be a history/ log of all entry exit - similiar to a bank statement but instead of transactions it is the movement of the vehicle and instead of debit and credit it is in or out. ofcourse that is an example.

3. **Approval Workflow:**
   - Which roles should require approval for pass creation? (Currently: supervisor/admin) - whoever has not been given approval rights through the user capability matrix. the lines of who is supervisor, who is clerk blrs a lot in a start up and sometimes things change very quickly so i cant hard code who has what powers - i need to be able to give and revoke them freely.
   - Should there be different approval rules for visitor vs vehicle passes? - Vehicle passes should only be approved by a superadmin. visitor pass can be approved by whoever has gthe permission. 
   - What happens if a pass is created but approval is pending when the visitor/vehicle arrives? - An alert should go to the approvers when the guard tries to scan a pass but it is not approved. they can then approve or reject.

4. **QR Code & Validation:**
   - Should QR codes work offline, or require internet connection for validation? - recommend.
   - How long should a QR code remain valid after pass expiry? - it should become invalid when pass expires.
   - Should guards be able to manually override validation if QR scan fails? - recommend mechanism for that.

5. **Entry/Exit Recording:**
   - What information must be captured during entry? (Time, guard name, notes?) - time and gaurd name should be automatic based on the profile of the approver and the timestamp. 
   - For vehicle exits, what's mandatory? (Odometer, photos, signatures?) - recommend
   - Can entry/exit be recorded retroactively if missed at the gate? - recommend

6. **Pass Status & Lifecycle:**
   - What are all possible pass statuses? (pending, active, inside, exited, expired, cancelled?) - yes
   - Can a pass be edited after creation but before approval? - yes
   - Can an expired pass be reactivated, or must a new pass be created? - ccan be reactivated

7. **Visitor Management:**
   - Should recurring visitors have a "frequent visitor" status with faster creation? - is it possible?
   - How long should visitor history be retained? - Ideally for years. so we have record it in an efficient manner.
   - Should there be a blacklist feature for visitors who violated rules? - not at the moment

8. **Bulk Operations:**
   - Who should have access to bulk pass creation? (Admin only?) - who ever is given the power
   - What's the maximum number of passes that can be created in bulk? - no limit
   - Should bulk operations require approval, or auto-approve? - same as other passes.

9. **Reports & Analytics:**
   - What metrics are most important? (Daily visitors, peak hours, pass approval time?) - knowing which vehicle they visited for is also going to be important. and how much time they spent there.
   - Should reports be exportable (PDF, Excel)? - yes
   - Who should have access to which reports? (Guards vs Admin vs Supervisors?) - whoever is given the power

10. **Integration & Notifications:**
    - Should pass creation trigger notifications to approvers? - yes
    - Should entry/exit trigger notifications to pass creator? - yes
    - Should there be integration with other modules (e.g., link vehicle pass to inspection)? - not right now

---

## 2. Stockyard Inventory Management

### Questions:

1. **Component Types:**
   - What types of components are tracked? (Battery, Tyre, Spare Parts - are there more?) battery, tyre, spareparts and miscellenous
   - Should each component type have different fields/attributes? - yes
   - Can new component types be added by admins, or are they fixed? - can be added

2. **Component Creation:**
   - Who can create components? (Admin, Yard Incharge only?) - whoever is given the power
   - What information is required when creating a component? (Serial number, cost, location?) as per component
   - Should components have a unique identifier (barcode/QR code) generated automatically? - yes

3. **Component Lifecycle:**
   - What are all possible component statuses? (Available, In Use, Maintenance, Retired?) - available, in use, maintainence, sold
   - Can components be transferred between yards? (If yes, what's the approval process?) - yes. the approval process happens outside the app
   - What happens when a component reaches end-of-life? - it is sold to scrap.

4. **Component Tracking:**
   - Should components be linked to specific vehicles? - yes and if they are changed to another vehicle than that should be visible. basically a timeline of where/which asset it has been used.
   - How is component usage tracked? (Installation date, removal date, usage hours?) - recommend
   - Should there be maintenance schedules/reminders for components? - yes

5. **Inventory Levels:**
   - Should the system track minimum/maximum stock levels per component type? - no
   - Should there be alerts when inventory is low? - no
   - Should reorder suggestions be generated automatically? - no

6. **Component Cost & Valuation:**
   - How is component cost tracked? (Purchase price, depreciation, current value?) - purchase price
   - Should cost analysis include installation/removal labor costs? - yes
   - Should there be profitability analysis per component? - no

7. **Component Health:**
   - What defines "component health"? (Age, usage hours, maintenance history?) - depends on the component
   - Should health scores be calculated automatically or manually entered? - depend on the component
   - What actions should be triggered by low health scores? - just make it red

8. **Component Ledger:**
   - What transactions should appear in the ledger? (Purchase, Installation, Removal, Transfer, sold?) 
   - Should the ledger show running balance/quantity? - depending on the item. for example each battery is a single unit in itself, but oils are in litres.
   - Can ledger entries be edited/cancelled after creation? - i dont understand the question

9. **Component Search & Filtering:**
   - What search criteria are most important? (Serial number, type, location, status?) yes those
   - Should there be advanced filters (date range, cost range, health score)? - yes
   - Should search support partial matches, wildcards? - recommend

10. **Reporting & Analytics:**
    - What inventory reports are needed? (Stock levels, valuation, usage trends?)
    - Should reports be real-time or snapshot-based? - realtime
    - Who needs access to inventory analytics? (Yard Incharge, Admin, Finance?) - whoever is given the power.

---

## 3. Stockyard Movements

### Questions:

1. **Movement Types:**
   - What are all possible movement types? (Entry, Exit, Transfer, Return?)
   - Should movements be one-way or bidirectional? (Can a component exit and then re-enter?) component can exit and reenter if it has gone for maintainence work or is being transfered to another yard but can't if it has been sold.
   - Are there different rules for different movement types? - like?

2. **Movement Creation:**
   - Who can create movements? (Yard Incharge, Guards, Admin?)
   - What information is mandatory? (Component, Movement type, Reason, Person responsible?) yes
   - Should movements require approval, or auto-approve based on role? approval of super admin. movement and vehicle entry exit are same

3. **Component Movement vs Vehicle Movement:**
   - Is there a distinction between moving a component vs moving a vehicle with components? - yes
   - Should vehicle movements automatically track component movements? - yes
   - Can a movement involve multiple components at once? - yes

4. **Movement Approval:**
   - Which movements require approval? (All, only transfers, only high-value items?) - vehicles have to be approved by superadmin, components can be approved by the assigned employee
   - Who can approve movements? (Admin, Yard Incharge, Supervisor?)
   - What happens if a movement is rejected? (Component stays in place?)

5. **QR Scanning for Movements:**
   - Should movements be recorded via QR scan at the gate? - at the time of entry it is in form of the gate pass for vehicle entry. same at time if exit actually.
   - Can movements be created manually if QR scan fails? - recommend
   - Should there be a timestamp and location (GPS) captured during scan? - yes

6. **Movement History:**
   - How long should movement history be retained? - forever ideally
   - Should there be a searchable history of all movements for a component? - yes, hence the component ledger
   - Can movement records be edited/cancelled after creation? - yes

7. **Stockyard Requests:**
   - What's the difference between a "movement" and a "stockyard request"? - what the stockyard request.
   - Should requests be created first, then converted to movements upon approval?
   - Can requests be bulk-created or must they be individual?

8. **Movement Validation:**
   - Should movements be validated against current inventory? (Prevent exit if not in stock?) yes
   - Should there be validation for transfer movements? (Check if target yard exists, has capacity?) - yes
   - What happens if validation fails? alert

9. **Movement Analytics:**
   - What movement metrics are important? (Daily movements, peak times, most moved components?)
   - Should there be alerts for unusual movement patterns? - how will they be identified
   - Should movement reports show trends over time? - yes

10. **Integration with Other Modules:**
    - Should movements be linked to vehicle inspections? (Component removed during inspection?) - no
    - Should movements affect expense tracking? (Component purchase/repair costs?) recommend
    - Should movements trigger notifications to relevant stakeholders? - yes

---

## 4. Vehicle Inspections

### Questions:

1. **Inspection Templates:**
   - Who can create/edit inspection templates? (Admin only, or Inspectors too?)
   - Should templates be versioned? (Can old inspections use old template versions?)
   - Can templates be customized per vehicle type, or are they universal?

2. **Inspection Creation Flow:**
   - Should inspectors be able to start an inspection without selecting a template first?
   - Can an inspection be saved as draft and resumed later?
   - Should there be a time limit for completing an inspection?

3. **Question Types & Data Capture:**
   - What question types are supported? (Text, Yes/No, Multiple Choice, Number, Photo, Audio, Signature?)
   - Are there conditional questions? (Show question B only if question A is "Yes"?)
   - Should photo capture support multiple photos per question?

4. **Offline Functionality:**
   - Should inspections work completely offline? (Create, save, submit all offline?)
   - How should offline inspections sync when connection is restored?
   - What happens if there's a conflict during sync? (Two inspectors edit same inspection?)

5. **Inspection Submission:**
   - Should inspections require approval before being finalized?
   - Can an inspection be edited after submission?
   - Should there be a "re-inspection" flow if issues are found?

6. **PDF Report Generation:**
   - Should PDFs be generated client-side (browser) or server-side?
   - What information should be included in the PDF? (All questions, only critical findings, photos?)
   - Can PDF templates be customized? (Company branding, layout, fields?)

7. **Inspection History & Search:**
   - How should completed inspections be organized? (By vehicle, by date, by inspector?)
   - Should there be search functionality? (By vehicle number, inspector name, date range?)
   - How long should inspection history be retained?

8. **Critical Findings:**
   - How are "critical findings" defined? (Specific question types, manual flagging?)
   - Should critical findings trigger alerts/notifications?
   - Should there be a separate workflow for addressing critical findings?

9. **Inspection Analytics:**
   - What metrics are important? (Inspections per day, average completion time, critical findings rate?)
   - Should there be trends analysis? (Vehicle health over time, common issues?)
   - Who should have access to inspection analytics?

10. **Integration:**
    - Should inspections be linked to gate passes? (Vehicle entering for inspection?)
    - Should inspections affect component movements? (Component removed/replaced during inspection?)
    - Should inspection data feed into vehicle health/analytics dashboards?

---

## 5. Expense Management

### Questions:

1. **Expense Creation:**
   - Who can create expenses? (All employees, or only specific roles?)
   - Should employees be able to create expenses for others, or only themselves?
   - What's the maximum expense amount before requiring additional approval?

2. **Expense Categories:**
   - What are the expense categories? (Travel, Meals, Supplies, Maintenance, etc.?)
   - Can categories be customized per organization, or are they fixed?
   - Should categories have sub-categories?

3. **Receipt Management:**
   - Is receipt upload mandatory for all expenses, or only above a certain amount?
   - Should receipt OCR be enabled? (Auto-extract amount, date, merchant?)
   - What receipt formats are supported? (Image, PDF?)

4. **Project/Asset Linkage:**
   - Should expenses be linked to projects? (If yes, what's a "project"?)
   - Should expenses be linked to assets/vehicles? (Maintenance costs, fuel?)
   - Can an expense be linked to multiple projects/assets?

5. **Advance Management:**
   - Should employees be able to request advances? (Or only record advances issued by admin?)
   - How are advances tracked? (Separate from expenses, or part of ledger?)
   - Should advances be automatically deducted from expense approvals?

6. **Approval Workflow:**
   - Who can approve expenses? (Supervisor, Admin, Finance?)
   - Should there be multi-level approvals? (Supervisor → Admin → Finance for large amounts?)
   - Can expenses be partially approved? (Approve 80% of amount, reject 20%?)

7. **Employee Ledger:**
   - What should the ledger show? (Balance, all transactions, pending approvals?)
   - Should the ledger show running balance? (Starting balance + advances - expenses = current balance?)
   - Can ledger entries be edited/cancelled after creation?

8. **Reconciliation:**
   - What does "reconciliation" mean in this context? (Matching expenses with bank statements?)
   - Who performs reconciliation? (Finance team, Admin?)
   - Should reconciliation be a separate workflow or part of approval?

9. **Expense Analytics:**
   - What analytics are needed? (Category-wise spending, project-wise costs, employee-wise expenses?)
   - Should there be budget tracking? (Set budget per category/project, track against it?)
   - Should analytics show trends over time?

10. **Integration:**
    - Should expenses be linked to inspections? (Inspection-related costs?)
    - Should expenses be linked to component movements? (Component purchase costs?)
    - Should expense data feed into financial reports/dashboards?

---

## 6. Unified Approvals

### Questions:

1. **Approval Scope:**
   - Which modules/items appear in unified approvals? (Gate Passes, Expenses, Component Transfers, Inspections?)
   - Should all pending items appear together, or be filterable by module?
   - Are there items that don't require approval but should appear in the list?

2. **Approval Priority:**
   - How is priority determined? (By creation date, by amount, by urgency flag?)
   - Should users be able to set priority when creating items?
   - Should high-priority items be highlighted or sorted to top?

3. **Approval Actions:**
   - What actions can be taken? (Approve, Reject, Request More Info, Reassign?)
   - Can approvals be conditional? (Approve with modifications, approve with notes?)
   - Should there be a "bulk approve" feature for similar items?

4. **Approval History:**
   - Should approval history show who approved/rejected and when?
   - Should there be a comment/notes field for each approval action?
   - Can approval decisions be reversed? (Undo approval, change to reject?)

5. **Notifications:**
   - Should approvers be notified of new pending items?
   - Should requesters be notified when their item is approved/rejected?
   - Should there be reminders for items pending approval for X days?

6. **Delegation & Reassignment:**
   - Can approvals be delegated to another user?
   - Can items be reassigned to a different approver?
   - Should there be an "auto-assign" feature based on rules?

7. **Approval Rules:**
   - Should approval rules be configurable? (Amount thresholds, role-based routing?)
   - Should there be escalation rules? (Auto-approve if no action in X days?)
   - Can rules vary by module or item type?

8. **Approval Analytics:**
   - What metrics are important? (Average approval time, approval rate, pending count?)
   - Should there be reports on approval performance? (Approver efficiency, bottlenecks?)
   - Should analytics show trends over time?

9. **Mobile Experience:**
   - Should approvals be optimized for mobile? (Quick approve/reject buttons?)
   - Should mobile show simplified view? (Key info only, full details on tap?)
   - Should mobile support offline approval? (Queue actions, sync when online?)

10. **Integration:**
    - Should approvals integrate with notifications system?
    - Should approval data feed into audit logs?
    - Should there be integration with external systems? (ERP, Accounting software?)

---

## 7. User Management (Admin)

### Questions:

1. **User Creation:**
   - Who can create users? (Super Admin only, or Admin too?)
   - What information is required? (Name, Email, Employee ID, Role, Yard Assignment?)
   - Should user creation require approval, or be immediate?

2. **Role Assignment:**
   - Can a user have multiple roles? (Inspector + Guard, Admin + Supervisor?)
   - Should roles be hierarchical? (Admin inherits Supervisor permissions?)
   - Can custom roles be created, or are roles fixed?

3. **Permission Management:**
   - Should permissions be role-based, user-based, or both?
   - Can permissions be granular? (User can create expenses but not approve them?)
   - Should there be permission templates for common configurations?

4. **Yard Assignment:**
   - Can users be assigned to multiple yards?
   - Should yard assignment affect what data users can see? (Only see their yard's data?)
   - Can yard assignments be temporary? (User assigned to Yard A for 1 week only?)

5. **User Status:**
   - What user statuses exist? (Active, Inactive, Suspended, Pending?)
   - What happens when a user is deactivated? (Can't login, but data remains?)
   - Should there be automatic deactivation? (After X days of inactivity?)

6. **Bulk Operations:**
   - What bulk operations are needed? (Bulk create, bulk role change, bulk deactivate?)
   - Should bulk operations require confirmation/approval?
   - Should there be import from CSV/Excel for bulk user creation?

7. **User Activity Tracking:**
   - What activities should be tracked? (Login, Actions, Module access?)
   - How long should activity logs be retained?
   - Who can view activity logs? (Super Admin only, or Admins too?)

8. **Permission Change Logs:**
   - Should all permission changes be logged? (Who changed what, when, why?)
   - Should permission changes require approval?
   - Should there be notifications when permissions change?

9. **Security Features:**
   - Should there be password policies? (Minimum length, complexity, expiration?)
   - Should there be 2FA/MFA support?
   - Should there be session management? (View active sessions, force logout?)

10. **User Analytics:**
    - What user metrics are important? (Active users, login frequency, module usage?)
    - Should there be reports on user activity? (Most active users, least used features?)
    - Should analytics help identify training needs or underutilized features?

---

## 8. Reports & Analytics

### Questions:

1. **Report Types:**
   - What reports are needed? (Module-specific, cross-module, financial, operational?)
   - Should reports be pre-built or customizable?
   - Should users be able to create custom reports?

2. **Report Access:**
   - Who can access which reports? (Role-based, permission-based?)
   - Should reports have different detail levels? (Summary for managers, detailed for admins?)
   - Should report access be audited?

3. **Report Generation:**
   - Should reports be generated on-demand or scheduled?
   - How long should report generation take? (Real-time, or can it be queued?)
   - Should reports be cached? (If data hasn't changed, use cached version?)

4. **Report Formats:**
   - What formats should be supported? (PDF, Excel, CSV, HTML?)
   - Should reports be printable?
   - Should reports be shareable? (Email, download link?)

5. **Report Filtering:**
   - What filters should be available? (Date range, module, user, status?)
   - Should filters be saved? (Save filter combinations for quick access?)
   - Should there be default filters per role?

6. **Dashboard Analytics:**
   - What should the main dashboard show? (Key metrics, recent activity, pending items?)
   - Should dashboards be customizable per user/role?
   - Should dashboards support real-time updates?

7. **Data Export:**
   - Should users be able to export raw data? (Not just reports, but underlying data?)
   - What export formats? (CSV, Excel, JSON?)
   - Should exports be limited? (Max rows, require approval for large exports?)

8. **Report Scheduling:**
   - Should reports be schedulable? (Daily, weekly, monthly email reports?)
   - Who can schedule reports? (Admins only, or users can schedule their own?)
   - Should scheduled reports be stored in a report library?

9. **Comparative Analysis:**
   - Should reports support comparisons? (This month vs last month, this year vs last year?)
   - Should there be trend analysis? (Show trends over time, predict future?)
   - Should reports highlight anomalies? (Unusual patterns, outliers?)

10. **Report Performance:**
    - What's the acceptable report generation time? (Seconds, minutes?)
    - Should large reports be generated asynchronously? (Show progress, notify when ready?)
    - Should there be limits on report complexity? (Max date range, max data points?)

---

## 9. Dashboard

### Questions:

1. **Dashboard Purpose:**
   - What's the primary purpose of the main dashboard? (Overview, quick actions, status check?)
   - Should the dashboard be role-specific? (Different widgets for Inspector vs Admin?)
   - Should the dashboard be the landing page after login?

2. **Dashboard Widgets:**
   - What widgets should be available? (Stats, Charts, Recent Items, Pending Approvals, Alerts?)
   - Should widgets be customizable? (Users can add/remove/reorder widgets?)
   - Should widgets be resizable? (Drag to resize, different sizes?)

3. **Real-time Updates:**
   - Should the dashboard update in real-time? (WebSocket, polling?)
   - How frequently should data refresh? (Every 30 seconds, 1 minute, 5 minutes?)
   - Should users be able to manually refresh?

4. **Key Metrics:**
   - What are the most important metrics to show? (Pending approvals, today's inspections, active passes?)
   - Should metrics be clickable? (Click to drill down to details?)
   - Should metrics show trends? (Up/down arrows, percentage change?)

5. **Recent Activity:**
   - What activities should appear? (Recent inspections, recent expenses, recent passes?)
   - How many recent items should be shown? (5, 10, 20?)
   - Should recent activity be filterable? (By module, by date?)

6. **Quick Actions:**
   - What quick actions should be available? (Create inspection, Create expense, Create pass?)
   - Should quick actions be role-specific?
   - Should quick actions be customizable? (Users can choose which actions to show?)

7. **Alerts & Notifications:**
   - Should the dashboard show alerts? (Pending approvals, overdue items, system alerts?)
   - How should alerts be prioritized? (Critical, Warning, Info?)
   - Should alerts be dismissible? (Mark as read, snooze?)

8. **Dashboard Layout:**
   - Should the dashboard have a grid layout? (Widgets in columns/rows?)
   - Should layout be responsive? (Different layout for mobile vs desktop?)
   - Should layout be saved per user? (Each user has their own layout?)

9. **Performance:**
   - How fast should the dashboard load? (Target: < 2 seconds?)
   - Should data be lazy-loaded? (Load visible widgets first, others on scroll?)
   - Should there be a loading state? (Skeleton screens, progress indicators?)

10. **Integration:**
    - Should the dashboard integrate with all modules? (Show data from all modules?)
    - Should the dashboard support external data? (API integrations, third-party widgets?)
    - Should the dashboard be embeddable? (Can be embedded in other systems?)

---

## 10. Work Page

### Questions:

1. **Work Page Purpose:**
   - What is the "Work" page? (Task list, assigned work, pending items?)
   - How is it different from the Dashboard?
   - Should it be role-specific? (Different view for Inspector vs Admin?)

2. **Work Items:**
   - What types of work items appear? (Pending inspections, pending approvals, assigned tasks?)
   - Should work items be filterable? (By type, by status, by date?)
   - Should work items be sortable? (By priority, by due date, by creation date?)

3. **Task Assignment:**
   - Can work be assigned to users? (Or is it auto-assigned based on role?)
   - Should there be task delegation? (Assign task to another user?)
   - Should tasks have due dates? (If yes, what happens if overdue?)

4. **Work Status:**
   - What statuses can work items have? (Pending, In Progress, Completed, Cancelled?)
   - Can users update work status? (Mark as in progress, mark as completed?)
   - Should status changes be tracked? (Who changed status, when?)

5. **Work Prioritization:**
   - How is priority determined? (Manual assignment, auto-based on rules, by creation date?)
   - Should priority be visible? (Color coding, badges, sorting?)
   - Can priority be changed? (By assignee, by assigner?)

6. **Work Notifications:**
   - Should users be notified of new work assignments?
   - Should there be reminders for overdue work?
   - Should notifications be configurable? (Email, push, in-app?)

7. **Work History:**
   - Should completed work be visible? (Or hidden after completion?)
   - How long should work history be retained?
   - Should there be analytics on work completion? (Average time, completion rate?)

8. **Work Collaboration:**
   - Can work items have comments/notes? (Collaboration between users?)
   - Can work items be shared? (View-only access for other users?)
   - Should there be @mentions? (Notify specific users in comments?)

9. **Work Templates:**
   - Should there be work templates? (Recurring tasks, standard workflows?)
   - Can templates be created by users, or only admins?
   - Should templates support variables? (Dynamic assignment, due dates?)

10. **Work Integration:**
    - Should work items link to related items? (Inspection work → Inspection details?)
    - Should work completion trigger actions? (Complete inspection → Generate PDF?)
    - Should work data feed into analytics? (Workload analysis, efficiency metrics?)

---

## Next Steps

After answering these questions, we will:
1. Update the codebase to match your expectations
2. Refine user flows and workflows
3. Adjust permissions and access controls
4. Optimize UI/UX based on actual use cases
5. Add missing features or remove unnecessary ones

**Please answer these questions, and I'll make the necessary changes to align the application with your requirements.**


