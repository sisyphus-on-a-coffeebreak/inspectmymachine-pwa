# Gate Pass ↔ Movement Implementation Status

## ✅ Completed

### 1. Type Definitions
- ✅ Added `ScanEvent` interface to `gatePassTypes.ts`
- ✅ Added `Movement` interface to `gatePassTypes.ts`
- ✅ Both interfaces include mandatory `pass_id` field

### 2. Service Layer Updates
- ✅ Updated `AccessService.recordEntry()` to accept:
  - `gate_id` (optional)
  - `guard_id` (optional)
  - `location` (GPS coordinates, optional)
  - `photos` (optional)
  - `condition_snapshot` (optional)
- ✅ Updated `AccessService.recordExit()` to accept:
  - `gate_id` (optional)
  - `guard_id` (optional)
  - `location` (GPS coordinates, optional)
  - `photos` (optional)
  - `odometer_km` (optional)
  - `component_snapshot` (optional)

### 3. Utility Functions
- ✅ Created `gateLocation.ts` utility:
  - `getCurrentLocation()` - Gets GPS coordinates
  - `getDefaultGateId()` - Gets gate ID from localStorage
  - `setCurrentGateId()` - Sets gate ID in localStorage

### 4. Validation Logic
- ✅ Added entry validation in `GuardRegister`:
  - Checks if pass can enter (`canEnter()`)
  - For vehicles: Checks if vehicle is already inside
  - Prevents duplicate entries
- ✅ Added exit validation in `GuardRegister`:
  - Checks if pass can exit (`canExit()`)
  - For vehicles: Checks if vehicle is actually inside
  - Prevents invalid exits

### 5. Frontend Integration
- ✅ Updated `GuardRegister` component:
  - Gets current user ID for `guard_id`
  - Gets GPS location on mount
  - Gets gate ID from localStorage
  - Passes all data to `recordEntry()` and `recordExit()`
  - Includes condition snapshot from asset checklist

### 6. Hook Updates
- ✅ Updated `useRecordEntry()` hook to accept new parameters
- ✅ Updated `useRecordExit()` hook to accept new parameters

---

## 🔄 Backend Requirements (To Be Implemented)

### Critical Backend Changes Needed

1. **Movement Creation on Entry/Exit**
   - When `/v2/gate-passes/{id}/entry` is called:
     - Create `scan_event` record with:
       - `pass_id` = gate pass ID
       - `gate_id` = from request or default
       - `guard_id` = from request or authenticated user
       - `scan_type` = 'entry'
       - `timestamp` = current time
       - `location` = from request
       - `qr_payload` = from gate pass
       - `validation_result` = 'valid'
     - Create `movement` record with:
       - `pass_id` = gate pass ID (MANDATORY)
       - `scan_event_id` = ID of scan event just created
       - `gate_id` = from scan event
       - `guard_id` = from scan event
       - `movement_type` = 'ENTRY'
       - `timestamp` = current time
       - `location` = from scan event
       - `condition_snapshot` = from request
       - `photos` = from request

   - When `/v2/gate-passes/{id}/exit` is called:
     - Create `scan_event` record with:
       - `pass_id` = gate pass ID
       - `gate_id` = from request or default
       - `guard_id` = from request or authenticated user
       - `scan_type` = 'exit'
       - `timestamp` = current time
       - `location` = from request
       - `qr_payload` = from gate pass
       - `validation_result` = 'valid'
     - Create `movement` record with:
       - `pass_id` = gate pass ID (MANDATORY)
       - `scan_event_id` = ID of scan event just created
       - `gate_id` = from scan event
       - `guard_id` = from scan event
       - `movement_type` = 'EXIT'
       - `timestamp` = current time
       - `location` = from scan event
       - `component_snapshot` = from request
       - `photos` = from request
       - `odometer_km` = from request

2. **Entry/Exit Validation**
   - **ENTRY Validation:**
     - ✅ Vehicle must be OUTSIDE (no active entry pass with status 'inside')
     - ✅ Pass must be APPROVED
     - ✅ Pass must be VALID (within valid_from and valid_to dates)
     - ✅ Guard has permission to scan
   
   - **EXIT Validation:**
     - ✅ Vehicle must be INSIDE (has active entry pass with status 'inside')
     - ✅ Pass must be APPROVED
     - ✅ Pass must be VALID
     - ✅ Guard has permission to scan

3. **Database Schema**
   - Ensure `movements` table has:
     - `pass_id` (UUID, NOT NULL, FOREIGN KEY to gate_passes)
     - `scan_event_id` (UUID, NOT NULL, FOREIGN KEY to scan_events)
     - `gate_id` (UUID, NOT NULL)
     - `guard_id` (INTEGER, NOT NULL)
   - Ensure `scan_events` table has:
     - `pass_id` (UUID, NOT NULL, FOREIGN KEY to gate_passes)
     - `gate_id` (UUID, NOT NULL)
     - `guard_id` (INTEGER, NOT NULL)

4. **Status Updates**
   - On entry: Update gate pass status to 'inside'
   - On exit: Update gate pass status to 'exited' or 'completed'
   - Update vehicle location status

---

## 📝 Frontend Notes

### Current Implementation
- Frontend sends all required data to backend
- Backend is responsible for:
  - Creating scan events
  - Creating movements
  - Linking them via `pass_id`
  - Validating entry/exit conditions

### Future Enhancements
- Add gate selection UI for guards
- Add photo capture during entry/exit
- Add odometer reading input for vehicle exits
- Show movement history on gate pass details page
- Display complete audit trail (Movement → Scan Event → Gate Pass → Creator → Approver)

---

## 🧪 Testing Checklist

- [ ] Test entry with valid pass (should create scan event + movement)
- [ ] Test entry with vehicle already inside (should fail validation)
- [ ] Test entry with expired pass (should fail validation)
- [ ] Test entry with unapproved pass (should fail validation)
- [ ] Test exit with valid pass (should create scan event + movement)
- [ ] Test exit with vehicle not inside (should fail validation)
- [ ] Verify `pass_id` is mandatory in movements table
- [ ] Verify scan events are created before movements
- [ ] Verify complete audit trail is queryable
- [ ] Test GPS location capture
- [ ] Test gate ID handling

---

## 📚 Related Documentation

- `PASS_MOVEMENT_ARCHITECTURE.md` - Complete architecture documentation
- `REQUIREMENTS_ANALYSIS.md` - Requirements analysis
- `FUNCTION_CLARIFICATION_QUESTIONS.md` - Original requirements

