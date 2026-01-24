# Gate Pass ↔ Movement Architecture

## Core Concept

**Stockyard Requests = Gate Passes**

When a gate pass (stockyard request) is scanned at the gate, it automatically creates an entry or exit movement. This creates a complete audit trail.

---

## Data Model Relationships

### Logical Chain

```
Movement → Scan Event → Gate Pass (Stockyard Request) → Creator → Approver
```

### Movement Record Structure

Every movement record **must** store:

```typescript
interface Movement {
  id: string;
  pass_id: string;              // MANDATORY - Links to gate pass/stockyard request
  scan_event_id: string;         // Links to the scan event that triggered this movement
  gate_id: string;               // Which gate was used
  guard_id: number;              // Which guard performed the scan
  
  // Movement-specific fields
  movement_type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'RETURN';
  vehicle_id?: string;
  component_id?: string;
  timestamp: string;
  location?: { lat: number; lng: number }; // GPS coordinates
  
  // Additional metadata
  notes?: string;
  photos?: string[];
  odometer_km?: number;
  condition_snapshot?: Record<string, unknown>;
}
```

### Scan Event Structure

```typescript
interface ScanEvent {
  id: string;
  pass_id: string;               // The gate pass that was scanned
  gate_id: string;
  guard_id: number;
  scan_type: 'entry' | 'exit';
  timestamp: string;
  location?: { lat: number; lng: number };
  qr_payload: string;            // What was scanned
  validation_result: 'valid' | 'invalid' | 'expired' | 'pending_approval';
  notes?: string;
}
```

### Gate Pass (Stockyard Request) Structure

```typescript
interface GatePass {
  id: string;                    // This is the stockyard_request_id
  vehicle_id?: string;
  yard_id: string;
  type: 'ENTRY' | 'EXIT';
  status: 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
  
  // Approval chain
  created_by: number;            // Creator
  approved_by?: number;          // Approver
  
  // Scan tracking
  scan_in_at?: string;
  scan_out_at?: string;
  scan_in_gatekeeper?: string;
  scan_out_gatekeeper?: string;
  
  // Validity
  valid_from?: string;
  valid_to?: string;
}
```

---

## Entry vs Exit Logic (Vehicle)

### ENTRY Pass Validation

**Prerequisites:**
- Vehicle must currently be **OUTSIDE** the yard
- Pass must be **APPROVED**
- Pass must be **VALID** (within valid_from and valid_to dates)

**When ENTRY Pass is Scanned:**

1. **Validation Checks:**
   - ✅ Vehicle is outside (no active entry pass with status 'inside')
   - ✅ Pass is approved
   - ✅ Pass is valid (not expired)
   - ✅ Guard has permission to scan

2. **Create Scan Event:**
   - Record scan_event with type='entry'
   - Capture guard_id, gate_id, timestamp, GPS location

3. **Create ENTRY Movement:**
   - Link movement to pass_id (mandatory)
   - Link movement to scan_event_id
   - Set movement_type = 'ENTRY'

4. **Triggers:**
   - **Condition Capture:** Record vehicle condition at entry
     - Broken glasses, batteries, components
     - Photos of vehicle condition
     - Initial component snapshot
   - **Update Pass Status:** Set pass status to 'inside'
   - **Update Vehicle Status:** Mark vehicle as inside yard

### EXIT Pass Validation

**Prerequisites:**
- Vehicle must currently be **INSIDE** the yard
- Pass must be **APPROVED**
- Pass must be **VALID**

**When EXIT Pass is Scanned:**

1. **Validation Checks:**
   - ✅ Vehicle is inside (has active entry pass with status 'inside')
   - ✅ Pass is approved
   - ✅ Pass is valid
   - ✅ Guard has permission to scan

2. **Create Scan Event:**
   - Record scan_event with type='exit'
   - Capture guard_id, gate_id, timestamp, GPS location

3. **Create EXIT Movement:**
   - Link movement to pass_id (mandatory)
   - Link movement to scan_event_id
   - Set movement_type = 'EXIT'

4. **Triggers:**
   - **Component Exit Validation:**
     - Check what components are leaving with vehicle
     - Validate against component ledger
     - Prevent exit if unauthorized components
   - **Final Snapshot:**
     - Record final condition
     - Capture exit photos
     - Record odometer reading
   - **Update Pass Status:** Set pass status to 'exited'
   - **Update Vehicle Status:** Mark vehicle as outside yard

---

## Audit Trail

### Complete Chain Example

**Scenario:** Vehicle enters yard for service

1. **Gate Pass Created:**
   ```
   Gate Pass ID: GP-12345
   Created By: User ID 42 (Clerk)
   Type: ENTRY
   Status: Submitted
   ```

2. **Gate Pass Approved:**
   ```
   Gate Pass ID: GP-12345
   Approved By: User ID 10 (Super Admin)
   Status: Approved
   Valid From: 2025-01-23T08:00:00Z
   Valid To: 2025-01-23T18:00:00Z
   ```

3. **Gate Pass Scanned (Entry):**
   ```
   Scan Event ID: SE-67890
   Pass ID: GP-12345
   Gate ID: GATE-1
   Guard ID: 15
   Scan Type: entry
   Timestamp: 2025-01-23T09:15:30Z
   Location: { lat: 28.6139, lng: 77.2090 }
   ```

4. **Entry Movement Created:**
   ```
   Movement ID: M-11111
   Pass ID: GP-12345 (MANDATORY)
   Scan Event ID: SE-67890
   Gate ID: GATE-1
   Guard ID: 15
   Movement Type: ENTRY
   Timestamp: 2025-01-23T09:15:30Z
   Condition Snapshot: { ... }
   Component Snapshot: [ ... ]
   ```

5. **Exit Movement (Later):**
   ```
   Movement ID: M-22222
   Pass ID: GP-12345 (MANDATORY)
   Scan Event ID: SE-67891
   Gate ID: GATE-1
   Guard ID: 15
   Movement Type: EXIT
   Timestamp: 2025-01-23T16:45:00Z
   Final Snapshot: { ... }
   ```

### Query Examples

**Get all movements for a gate pass:**
```sql
SELECT * FROM movements WHERE pass_id = 'GP-12345';
```

**Get complete audit trail:**
```sql
SELECT 
  m.*,
  se.timestamp as scan_timestamp,
  se.guard_id as scanning_guard,
  gp.created_by as pass_creator,
  gp.approved_by as pass_approver
FROM movements m
JOIN scan_events se ON m.scan_event_id = se.id
JOIN gate_passes gp ON m.pass_id = gp.id
WHERE m.pass_id = 'GP-12345'
ORDER BY m.timestamp;
```

**Get all movements by guard:**
```sql
SELECT * FROM movements WHERE guard_id = 15;
```

**Get all movements at a gate:**
```sql
SELECT * FROM movements WHERE gate_id = 'GATE-1';
```

---

## Implementation Requirements

### Backend Requirements

1. **Movement Creation:**
   - Movement creation MUST be triggered by gate pass scan
   - `pass_id` is MANDATORY - movement cannot exist without gate pass
   - `scan_event_id` links to the scan that triggered the movement
   - `gate_id` and `guard_id` captured automatically from scan context

2. **Validation Logic:**
   - ENTRY: Vehicle must be outside before allowing entry
   - EXIT: Vehicle must be inside before allowing exit
   - Both require approved and valid gate pass

3. **Status Updates:**
   - Entry scan → Update gate pass status to 'inside'
   - Exit scan → Update gate pass status to 'exited'
   - Update vehicle location status

4. **Component Tracking:**
   - Entry: Capture initial component snapshot
   - Exit: Validate components leaving match expected

### Frontend Requirements

1. **Scan Interface:**
   - When guard scans gate pass QR code:
     - Validate pass (approved, valid, correct state)
     - Create scan event
     - Create movement automatically
     - Show success/error feedback

2. **Movement Display:**
   - Show movement history linked to gate pass
   - Display complete audit chain
   - Show guard, gate, timestamp for each movement

3. **Validation Feedback:**
   - Clear error messages for invalid scans:
     - "Vehicle is already inside" (for entry)
     - "Vehicle is not inside" (for exit)
     - "Pass not approved"
     - "Pass expired"

---

## Database Schema Recommendations

### movements table
```sql
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID NOT NULL,              -- MANDATORY: Links to gate_pass
  scan_event_id UUID NOT NULL,        -- Links to scan_event
  gate_id UUID NOT NULL,              -- Which gate
  guard_id INTEGER NOT NULL,           -- Which guard
  
  movement_type VARCHAR(20) NOT NULL, -- ENTRY, EXIT, TRANSFER, RETURN
  vehicle_id UUID,
  component_id UUID,
  
  timestamp TIMESTAMP NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  notes TEXT,
  photos TEXT[],                      -- Array of photo URLs
  odometer_km INTEGER,
  condition_snapshot JSONB,
  component_snapshot JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (pass_id) REFERENCES gate_passes(id),
  FOREIGN KEY (scan_event_id) REFERENCES scan_events(id),
  FOREIGN KEY (gate_id) REFERENCES gates(id),
  FOREIGN KEY (guard_id) REFERENCES users(id)
);

CREATE INDEX idx_movements_pass_id ON movements(pass_id);
CREATE INDEX idx_movements_scan_event_id ON movements(scan_event_id);
CREATE INDEX idx_movements_guard_id ON movements(guard_id);
CREATE INDEX idx_movements_gate_id ON movements(gate_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp);
```

### scan_events table
```sql
CREATE TABLE scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID NOT NULL,
  gate_id UUID NOT NULL,
  guard_id INTEGER NOT NULL,
  
  scan_type VARCHAR(10) NOT NULL,     -- 'entry' or 'exit'
  timestamp TIMESTAMP NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  qr_payload TEXT NOT NULL,
  validation_result VARCHAR(20) NOT NULL, -- 'valid', 'invalid', 'expired', 'pending_approval'
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (pass_id) REFERENCES gate_passes(id),
  FOREIGN KEY (gate_id) REFERENCES gates(id),
  FOREIGN KEY (guard_id) REFERENCES users(id)
);

CREATE INDEX idx_scan_events_pass_id ON scan_events(pass_id);
CREATE INDEX idx_scan_events_guard_id ON scan_events(guard_id);
CREATE INDEX idx_scan_events_timestamp ON scan_events(timestamp);
```

---

## Benefits of This Architecture

1. **Court-Grade Auditability:**
   - Every movement is linked to a gate pass
   - Every movement is linked to a scan event
   - Complete chain: Movement → Scan → Pass → Creator → Approver

2. **Data Integrity:**
   - Cannot create movement without gate pass
   - Cannot create movement without scan event
   - All relationships are enforced at database level

3. **Traceability:**
   - Know exactly who scanned what, when, and where
   - Complete history of all vehicle movements
   - Easy to query and report

4. **Validation:**
   - Entry/exit logic enforced at database level
   - Prevents invalid state transitions
   - Ensures data consistency

---

## Migration Path

If current implementation doesn't have these connections:

1. **Add Foreign Keys:**
   - Add `pass_id` to movements table (if missing)
   - Add `scan_event_id` to movements table (if missing)
   - Add `gate_id` and `guard_id` to movements table (if missing)

2. **Backfill Data:**
   - Link existing movements to gate passes
   - Create scan events for historical movements
   - Ensure all required fields are populated

3. **Update Application Logic:**
   - Ensure movement creation always includes pass_id
   - Create scan event before creating movement
   - Enforce validation rules

---

## Questions for Clarification

1. **Component Movements:**
   - Do component movements also require a gate pass, or only vehicle movements?
   - If component movements don't require gate pass, what links them?

2. **Transfer Movements:**
   - Are transfer movements between yards also linked to gate passes?
   - Or are they a separate workflow?

3. **Manual Entry:**
   - If QR scan fails and guard manually enters, how is scan_event_id handled?
   - Should manual entry create a scan event with validation_result='manual'?

