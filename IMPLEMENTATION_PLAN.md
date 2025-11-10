# 🚀 VOMS PWA - Complete Implementation Plan

**Document Version:** 1.0
**Created:** 2025-11-10
**Status:** Ready for Implementation

---

## 📋 Table of Contents

1. [Phase 1: Critical Backend (Week 1-2)](#phase-1-critical-backend-week-1-2)
2. [Phase 2: Management Dashboards (Week 2-3)](#phase-2-management-dashboards-week-2-3)
3. [Phase 3: Pass Management (Week 3-4)](#phase-3-pass-management-week-3-4)
4. [Phase 4: Polish & Features (Week 4+)](#phase-4-polish--features-week-4)
5. [Database Schema Changes](#database-schema-changes)
6. [Testing Requirements](#testing-requirements)
7. [Deployment Checklist](#deployment-checklist)

---

# Phase 1: Critical Backend (Week 1-2)

**Goal:** Enable core workflows - approval processes and inspection dashboard

**Priority:** 🔴 CRITICAL - Blocks core functionality

**Estimated Time:** 8-10 days

---

## 1.1 Inspection Dashboard API

### Backend Endpoint: `/api/v1/inspection-dashboard`

**Method:** `GET`

**Authentication:** Required (Laravel Sanctum)

**Authorization:** All authenticated users

### Request

```http
GET /api/v1/inspection-dashboard HTTP/1.1
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (optional): `today` | `week` | `month` | `all` (default: `all`)

### Response

```json
{
  "stats": {
    "total_today": 5,
    "total_week": 23,
    "total_month": 87,
    "pending": 3,
    "completed": 12,
    "approved": 8,
    "rejected": 1,
    "pass_rate": 85.5,
    "avg_duration": 45,
    "critical_issues": 2
  },
  "recent_inspections": [
    {
      "id": "uuid-123",
      "vehicle_registration": "MH12AB1234",
      "vehicle_make": "Tata",
      "vehicle_model": "Ace",
      "inspector_name": "John Doe",
      "inspector_id": "INSP001",
      "status": "completed",
      "overall_rating": 8.5,
      "pass_fail": "pass",
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T11:30:00Z",
      "has_critical_issues": false
    }
  ]
}
```

### Database Queries Required

```sql
-- Get today's count
SELECT COUNT(*) FROM inspections
WHERE DATE(created_at) = CURDATE();

-- Get pass rate
SELECT
  (COUNT(CASE WHEN pass_fail = 'pass' THEN 1 END) * 100.0 / COUNT(*)) as pass_rate
FROM inspections
WHERE status = 'completed';

-- Get average duration (in minutes)
SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_duration
FROM inspections
WHERE status = 'completed';

-- Get critical issues count
SELECT COUNT(*) FROM inspections
WHERE has_critical_issues = true
AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Get recent inspections
SELECT
  i.*,
  u.name as inspector_name,
  u.employee_id as inspector_id
FROM inspections i
LEFT JOIN users u ON i.inspector_id = u.id
ORDER BY i.created_at DESC
LIMIT 10;
```

### Laravel Controller Example

```php
// app/Http/Controllers/Api/InspectionDashboardController.php

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InspectionDashboardController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->input('period', 'all');

        $stats = [
            'total_today' => $this->getTodayCount(),
            'total_week' => $this->getWeekCount(),
            'total_month' => $this->getMonthCount(),
            'pending' => Inspection::where('status', 'pending')->count(),
            'completed' => Inspection::where('status', 'completed')->count(),
            'approved' => Inspection::where('status', 'approved')->count(),
            'rejected' => Inspection::where('status', 'rejected')->count(),
            'pass_rate' => $this->getPassRate(),
            'avg_duration' => $this->getAverageDuration(),
            'critical_issues' => $this->getCriticalIssuesCount(),
        ];

        $recentInspections = Inspection::with(['inspector:id,name,employee_id'])
            ->select([
                'id',
                'vehicle_registration',
                'vehicle_make',
                'vehicle_model',
                'inspector_id',
                'status',
                'overall_rating',
                'pass_fail',
                'has_critical_issues',
                'created_at',
                'updated_at'
            ])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($inspection) {
                return [
                    'id' => $inspection->id,
                    'vehicle_registration' => $inspection->vehicle_registration,
                    'vehicle_make' => $inspection->vehicle_make,
                    'vehicle_model' => $inspection->vehicle_model,
                    'inspector_name' => $inspection->inspector->name ?? 'Unknown',
                    'inspector_id' => $inspection->inspector->employee_id ?? 'N/A',
                    'status' => $inspection->status,
                    'overall_rating' => $inspection->overall_rating,
                    'pass_fail' => $inspection->pass_fail,
                    'has_critical_issues' => $inspection->has_critical_issues,
                    'created_at' => $inspection->created_at->toISOString(),
                    'updated_at' => $inspection->updated_at->toISOString(),
                ];
            });

        return response()->json([
            'stats' => $stats,
            'recent_inspections' => $recentInspections,
        ]);
    }

    private function getTodayCount()
    {
        return Inspection::whereDate('created_at', today())->count();
    }

    private function getWeekCount()
    {
        return Inspection::where('created_at', '>=', now()->subWeek())->count();
    }

    private function getMonthCount()
    {
        return Inspection::where('created_at', '>=', now()->subMonth())->count();
    }

    private function getPassRate()
    {
        $completed = Inspection::where('status', 'completed')->count();
        if ($completed === 0) return 0;

        $passed = Inspection::where('status', 'completed')
            ->where('pass_fail', 'pass')
            ->count();

        return round(($passed / $completed) * 100, 1);
    }

    private function getAverageDuration()
    {
        return Inspection::where('status', 'completed')
            ->whereNotNull('updated_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_duration')
            ->value('avg_duration') ?? 0;
    }

    private function getCriticalIssuesCount()
    {
        return Inspection::where('has_critical_issues', true)
            ->where('created_at', '>=', now()->subWeek())
            ->count();
    }
}
```

### Routes

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/v1/inspection-dashboard', [InspectionDashboardController::class, 'index']);
});
```

### Frontend Integration

**File:** `src/pages/inspections/InspectionDashboard.tsx`

**Changes Required:**
- Line 52: Endpoint already correct `/api/v1/inspection-dashboard`
- Remove mock data fallback (lines 59-138) once backend is ready
- Add proper error handling

**Testing:**
```bash
# Test the endpoint
curl -X GET http://localhost:8000/api/v1/inspection-dashboard \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

## 1.2 Gate Pass Approval API

### Backend Endpoints

#### 1.2.1 Get Pending Approvals

**Endpoint:** `/api/gate-pass-approval/pending`

**Method:** `GET`

**Authentication:** Required

**Authorization:** `admin`, `super_admin`, `supervisor` roles

### Request

```http
GET /api/gate-pass-approval/pending?status=pending HTTP/1.1
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): `all` | `pending` | `approved` | `rejected` | `escalated`

### Response

```json
[
  {
    "id": "uuid-123",
    "pass_id": "uuid-456",
    "pass_number": "VP123456",
    "pass_type": "visitor",
    "requester_name": "John Smith",
    "requester_id": "CLERK001",
    "request_date": "2025-01-20T10:00:00Z",
    "approval_level": 1,
    "current_approver": "Manager",
    "status": "pending",
    "approval_notes": null,
    "rejection_reason": null,
    "escalation_reason": null,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
]
```

#### 1.2.2 Get Pass Details

**Endpoint:** `/api/gate-pass-approval/pass-details/{passId}`

**Method:** `GET`

### Response

```json
{
  "id": "uuid-456",
  "pass_number": "VP123456",
  "type": "visitor",
  "visitor_name": "John Doe",
  "vehicle_registration": null,
  "purpose": "inspection",
  "valid_from": "2025-01-21T09:00:00Z",
  "valid_to": "2025-01-21T17:00:00Z",
  "requester_name": "John Smith",
  "requester_id": "CLERK001",
  "request_notes": "Client inspection for vehicle purchase",
  "urgency": "medium",
  "created_at": "2025-01-20T10:00:00Z"
}
```

#### 1.2.3 Get Approval History

**Endpoint:** `/api/gate-pass-approval/history/{approvalRequestId}`

**Method:** `GET`

### Response

```json
[
  {
    "level": 1,
    "approver_role": "Manager",
    "approver_name": "Jane Manager",
    "approver_id": "MGR001",
    "required": true,
    "status": "approved",
    "approved_at": "2025-01-20T11:00:00Z",
    "notes": "Approved for site inspection"
  },
  {
    "level": 2,
    "approver_role": "Supervisor",
    "approver_name": "Bob Supervisor",
    "approver_id": "SUP001",
    "required": false,
    "status": "pending",
    "approved_at": null,
    "notes": null
  }
]
```

#### 1.2.4 Approve Pass

**Endpoint:** `/api/gate-pass-approval/approve/{approvalRequestId}`

**Method:** `POST`

### Request

```json
{
  "notes": "Approved for site inspection"
}
```

### Response

```json
{
  "success": true,
  "message": "Pass approval request approved successfully",
  "approval_request": {
    "id": "uuid-123",
    "status": "approved",
    "approved_by": "MGR001",
    "approved_at": "2025-01-20T11:00:00Z",
    "approval_notes": "Approved for site inspection"
  },
  "next_level": null
}
```

#### 1.2.5 Reject Pass

**Endpoint:** `/api/gate-pass-approval/reject/{approvalRequestId}`

**Method:** `POST`

### Request

```json
{
  "reason": "Insufficient documentation provided"
}
```

### Response

```json
{
  "success": true,
  "message": "Pass approval request rejected",
  "approval_request": {
    "id": "uuid-123",
    "status": "rejected",
    "rejected_by": "MGR001",
    "rejected_at": "2025-01-20T11:00:00Z",
    "rejection_reason": "Insufficient documentation provided"
  }
}
```

#### 1.2.6 Escalate Pass

**Endpoint:** `/api/gate-pass-approval/escalate/{approvalRequestId}`

**Method:** `POST`

### Request

```json
{
  "reason": "Requires higher level approval due to extended duration"
}
```

### Response

```json
{
  "success": true,
  "message": "Pass approval request escalated to next level",
  "approval_request": {
    "id": "uuid-123",
    "status": "escalated",
    "approval_level": 2,
    "current_approver": "Supervisor",
    "escalation_reason": "Requires higher level approval due to extended duration"
  }
}
```

#### 1.2.7 Bulk Approve

**Endpoint:** `/api/gate-pass-approval/bulk-approve`

**Method:** `POST`

### Request

```json
{
  "approval_request_ids": ["uuid-123", "uuid-456", "uuid-789"],
  "notes": "Bulk approval for routine requests"
}
```

### Response

```json
{
  "success": true,
  "message": "3 approval requests processed",
  "results": {
    "approved": 3,
    "failed": 0
  },
  "details": [
    {
      "id": "uuid-123",
      "status": "approved"
    },
    {
      "id": "uuid-456",
      "status": "approved"
    },
    {
      "id": "uuid-789",
      "status": "approved"
    }
  ]
}
```

### Database Schema

```sql
-- Create approval_requests table
CREATE TABLE approval_requests (
    id CHAR(36) PRIMARY KEY,
    pass_id CHAR(36) NOT NULL,
    pass_type ENUM('visitor', 'vehicle') NOT NULL,
    requester_id CHAR(36) NOT NULL,
    approval_level INT DEFAULT 1,
    current_approver_role VARCHAR(50),
    status ENUM('pending', 'approved', 'rejected', 'escalated') DEFAULT 'pending',
    approval_notes TEXT NULL,
    rejection_reason TEXT NULL,
    escalation_reason TEXT NULL,
    approved_by CHAR(36) NULL,
    approved_at TIMESTAMP NULL,
    rejected_by CHAR(36) NULL,
    rejected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (rejected_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_pass_id (pass_id),
    INDEX idx_created_at (created_at)
);

-- Create approval_levels table for tracking multi-level approvals
CREATE TABLE approval_levels (
    id CHAR(36) PRIMARY KEY,
    approval_request_id CHAR(36) NOT NULL,
    level INT NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approver_id CHAR(36) NULL,
    required BOOLEAN DEFAULT true,
    status ENUM('pending', 'approved', 'rejected', 'skipped') DEFAULT 'pending',
    notes TEXT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id),
    UNIQUE KEY unique_approval_level (approval_request_id, level)
);

-- Add approval workflow fields to gate pass tables
ALTER TABLE visitor_gate_passes
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
ADD COLUMN approval_request_id CHAR(36) NULL,
ADD FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id);

ALTER TABLE vehicle_entry_passes
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
ADD COLUMN approval_request_id CHAR(36) NULL,
ADD FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id);

ALTER TABLE vehicle_exit_passes
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
ADD COLUMN approval_request_id CHAR(36) NULL,
ADD FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id);
```

### Laravel Models

```php
// app/Models/ApprovalRequest.php

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'pass_id',
        'pass_type',
        'requester_id',
        'approval_level',
        'current_approver_role',
        'status',
        'approval_notes',
        'rejection_reason',
        'escalation_reason',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function approvalLevels(): HasMany
    {
        return $this->hasMany(ApprovalLevel::class);
    }

    public function getPassAttribute()
    {
        if ($this->pass_type === 'visitor') {
            return VisitorGatePass::find($this->pass_id);
        }

        return VehicleEntryPass::find($this->pass_id)
            ?? VehicleExitPass::find($this->pass_id);
    }
}
```

```php
// app/Models/ApprovalLevel.php

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalLevel extends Model
{
    use HasUuids;

    protected $fillable = [
        'approval_request_id',
        'level',
        'approver_role',
        'approver_id',
        'required',
        'status',
        'notes',
        'approved_at',
    ];

    protected $casts = [
        'required' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
```

### Laravel Controller

```php
// app/Http/Controllers/Api/GatePassApprovalController.php

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\ApprovalLevel;
use App\Models\VisitorGatePass;
use App\Models\VehicleEntryPass;
use App\Models\VehicleExitPass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GatePassApprovalController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin,super_admin,supervisor']);
    }

    public function getPending(Request $request)
    {
        $status = $request->input('status', 'pending');

        $query = ApprovalRequest::with(['requester:id,name,employee_id'])
            ->select([
                'id',
                'pass_id',
                'pass_type',
                'requester_id',
                'approval_level',
                'current_approver_role',
                'status',
                'approval_notes',
                'rejection_reason',
                'escalation_reason',
                'created_at',
                'updated_at'
            ]);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $approvalRequests = $query->orderBy('created_at', 'desc')->get();

        return response()->json($approvalRequests->map(function ($request) {
            return [
                'id' => $request->id,
                'pass_id' => $request->pass_id,
                'pass_number' => $this->getPassNumber($request),
                'pass_type' => $request->pass_type,
                'requester_name' => $request->requester->name ?? 'Unknown',
                'requester_id' => $request->requester->employee_id ?? 'N/A',
                'request_date' => $request->created_at->toISOString(),
                'approval_level' => $request->approval_level,
                'current_approver' => $request->current_approver_role,
                'status' => $request->status,
                'approval_notes' => $request->approval_notes,
                'rejection_reason' => $request->rejection_reason,
                'escalation_reason' => $request->escalation_reason,
                'created_at' => $request->created_at->toISOString(),
                'updated_at' => $request->updated_at->toISOString(),
            ];
        }));
    }

    public function getPassDetails($passId)
    {
        // Try visitor passes first
        $pass = VisitorGatePass::find($passId);
        $type = 'visitor';

        // If not found, try vehicle passes
        if (!$pass) {
            $pass = VehicleEntryPass::find($passId) ?? VehicleExitPass::find($passId);
            $type = 'vehicle';
        }

        if (!$pass) {
            return response()->json(['error' => 'Pass not found'], 404);
        }

        $approvalRequest = ApprovalRequest::where('pass_id', $passId)->first();

        return response()->json([
            'id' => $pass->id,
            'pass_number' => $pass->pass_number ?? $pass->reference_number ?? 'N/A',
            'type' => $type,
            'visitor_name' => $pass->visitor_name ?? null,
            'vehicle_registration' => $pass->vehicle_registration ?? null,
            'purpose' => $pass->purpose ?? $pass->reason ?? 'N/A',
            'valid_from' => $pass->entry_time ?? $pass->created_at,
            'valid_to' => $pass->exit_time ?? $pass->expected_return,
            'requester_name' => $approvalRequest->requester->name ?? 'Unknown',
            'requester_id' => $approvalRequest->requester->employee_id ?? 'N/A',
            'request_notes' => $pass->notes ?? null,
            'urgency' => $pass->urgency ?? 'medium',
            'created_at' => $pass->created_at->toISOString(),
        ]);
    }

    public function getApprovalHistory($approvalRequestId)
    {
        $levels = ApprovalLevel::where('approval_request_id', $approvalRequestId)
            ->with('approver:id,name,employee_id')
            ->orderBy('level')
            ->get();

        return response()->json($levels->map(function ($level) {
            return [
                'level' => $level->level,
                'approver_role' => $level->approver_role,
                'approver_name' => $level->approver->name ?? 'Pending Assignment',
                'approver_id' => $level->approver->employee_id ?? 'N/A',
                'required' => $level->required,
                'status' => $level->status,
                'approved_at' => $level->approved_at?->toISOString(),
                'notes' => $level->notes,
            ];
        }));
    }

    public function approve(Request $request, $approvalRequestId)
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $approvalRequest = ApprovalRequest::findOrFail($approvalRequestId);

        if ($approvalRequest->status !== 'pending') {
            return response()->json([
                'error' => 'Approval request is not pending'
            ], 400);
        }

        DB::transaction(function () use ($approvalRequest, $request) {
            // Update approval request
            $approvalRequest->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_notes' => $request->input('notes'),
            ]);

            // Update approval level
            ApprovalLevel::where('approval_request_id', $approvalRequest->id)
                ->where('level', $approvalRequest->approval_level)
                ->update([
                    'status' => 'approved',
                    'approver_id' => auth()->id(),
                    'approved_at' => now(),
                    'notes' => $request->input('notes'),
                ]);

            // Update the pass status
            $this->updatePassStatus($approvalRequest->pass_id, $approvalRequest->pass_type, 'approved');
        });

        return response()->json([
            'success' => true,
            'message' => 'Pass approval request approved successfully',
            'approval_request' => $approvalRequest->fresh(),
        ]);
    }

    public function reject(Request $request, $approvalRequestId)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $approvalRequest = ApprovalRequest::findOrFail($approvalRequestId);

        if ($approvalRequest->status !== 'pending') {
            return response()->json([
                'error' => 'Approval request is not pending'
            ], 400);
        }

        DB::transaction(function () use ($approvalRequest, $request) {
            $approvalRequest->update([
                'status' => 'rejected',
                'rejected_by' => auth()->id(),
                'rejected_at' => now(),
                'rejection_reason' => $request->input('reason'),
            ]);

            ApprovalLevel::where('approval_request_id', $approvalRequest->id)
                ->where('level', $approvalRequest->approval_level)
                ->update([
                    'status' => 'rejected',
                    'approver_id' => auth()->id(),
                    'notes' => $request->input('reason'),
                ]);

            $this->updatePassStatus($approvalRequest->pass_id, $approvalRequest->pass_type, 'rejected');
        });

        return response()->json([
            'success' => true,
            'message' => 'Pass approval request rejected',
            'approval_request' => $approvalRequest->fresh(),
        ]);
    }

    public function escalate(Request $request, $approvalRequestId)
    {
        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $approvalRequest = ApprovalRequest::findOrFail($approvalRequestId);

        if ($approvalRequest->status !== 'pending') {
            return response()->json([
                'error' => 'Approval request is not pending'
            ], 400);
        }

        $nextLevel = $approvalRequest->approval_level + 1;
        $nextApproverRole = $this->getNextApproverRole($nextLevel);

        if (!$nextApproverRole) {
            return response()->json([
                'error' => 'No higher approval level available'
            ], 400);
        }

        DB::transaction(function () use ($approvalRequest, $request, $nextLevel, $nextApproverRole) {
            $approvalRequest->update([
                'status' => 'escalated',
                'approval_level' => $nextLevel,
                'current_approver_role' => $nextApproverRole,
                'escalation_reason' => $request->input('reason'),
            ]);

            // Mark current level as skipped
            ApprovalLevel::where('approval_request_id', $approvalRequest->id)
                ->where('level', $approvalRequest->approval_level - 1)
                ->update([
                    'status' => 'skipped',
                    'notes' => 'Escalated to level ' . $nextLevel,
                ]);

            // Create or update next level
            ApprovalLevel::updateOrCreate(
                [
                    'approval_request_id' => $approvalRequest->id,
                    'level' => $nextLevel,
                ],
                [
                    'approver_role' => $nextApproverRole,
                    'required' => true,
                    'status' => 'pending',
                ]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Pass approval request escalated to next level',
            'approval_request' => $approvalRequest->fresh(),
        ]);
    }

    private function getPassNumber($approvalRequest)
    {
        $pass = $approvalRequest->pass;
        return $pass->pass_number ?? $pass->reference_number ?? 'N/A';
    }

    private function updatePassStatus($passId, $passType, $status)
    {
        if ($passType === 'visitor') {
            VisitorGatePass::where('id', $passId)->update(['approval_status' => $status]);
        } else {
            VehicleEntryPass::where('id', $passId)->update(['approval_status' => $status]);
            VehicleExitPass::where('id', $passId)->update(['approval_status' => $status]);
        }
    }

    private function getNextApproverRole($level)
    {
        $roles = [
            1 => 'supervisor',
            2 => 'admin',
            3 => 'super_admin',
        ];

        return $roles[$level] ?? null;
    }
}
```

### Routes

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('gate-pass-approval')->group(function () {
        Route::get('/pending', [GatePassApprovalController::class, 'getPending']);
        Route::get('/pass-details/{passId}', [GatePassApprovalController::class, 'getPassDetails']);
        Route::get('/history/{approvalRequestId}', [GatePassApprovalController::class, 'getApprovalHistory']);
        Route::post('/approve/{approvalRequestId}', [GatePassApprovalController::class, 'approve']);
        Route::post('/reject/{approvalRequestId}', [GatePassApprovalController::class, 'reject']);
        Route::post('/escalate/{approvalRequestId}', [GatePassApprovalController::class, 'escalate']);
    });
});
```

### Frontend Integration

**File:** `src/pages/gatepass/PassApproval.tsx`

**Changes Required:**
- Endpoints already match (lines 67, 111, 133, 172, 196, 216)
- Remove mock data fallback (lines 73-103, 116-128, 138-154) once backend is ready
- API calls are already correctly structured

---

## 1.3 Expense Approval API

### Backend Endpoints

#### 1.3.1 Get Pending Expenses

**Endpoint:** `/api/expense-approval/pending`

**Method:** `GET`

**Query Parameters:**
- `status`: `all` | `pending` | `approved` | `rejected`

### Response

```json
[
  {
    "id": "uuid-123",
    "amount": 2500,
    "category": "fuel",
    "payment_method": "cash",
    "status": "pending",
    "notes": "Fuel for site visit",
    "receipt_key": "receipt-123",
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z",
    "employee_name": "John Smith",
    "employee_id": "EMP001",
    "project_name": "Project Alpha",
    "project_id": "uuid-project-1",
    "asset_name": null,
    "asset_id": null,
    "approved_by": null,
    "approved_at": null,
    "rejected_by": null,
    "rejected_at": null,
    "rejection_reason": null
  }
]
```

#### 1.3.2 Get Approval Stats

**Endpoint:** `/api/expense-approval/stats`

**Method:** `GET`

### Response

```json
{
  "total_expenses": 45,
  "pending": 12,
  "approved": 28,
  "rejected": 5,
  "approved_amount": 125000,
  "pending_amount": 35000,
  "average_amount": 3500
}
```

#### 1.3.3 Approve Expense

**Endpoint:** `/api/expense-approval/approve/{expenseId}`

**Method:** `POST`

### Request

```json
{
  "notes": "Approved as per company policy"
}
```

### Response

```json
{
  "success": true,
  "message": "Expense approved successfully",
  "expense": {
    "id": "uuid-123",
    "status": "approved",
    "approved_by": "ADMIN001",
    "approved_at": "2025-01-20T11:00:00Z"
  }
}
```

#### 1.3.4 Reject Expense

**Endpoint:** `/api/expense-approval/reject/{expenseId}`

**Method:** `POST`

### Request

```json
{
  "reason": "Receipt not clear, please resubmit"
}
```

### Response

```json
{
  "success": true,
  "message": "Expense rejected",
  "expense": {
    "id": "uuid-123",
    "status": "rejected",
    "rejected_by": "ADMIN001",
    "rejected_at": "2025-01-20T11:00:00Z",
    "rejection_reason": "Receipt not clear, please resubmit"
  }
}
```

#### 1.3.5 Bulk Approve

**Endpoint:** `/api/expense-approval/bulk-approve`

**Method:** `POST`

### Request

```json
{
  "expense_ids": ["uuid-123", "uuid-456"],
  "notes": "Bulk approval"
}
```

#### 1.3.6 Bulk Reject

**Endpoint:** `/api/expense-approval/bulk-reject`

**Method:** `POST`

### Request

```json
{
  "expense_ids": ["uuid-123", "uuid-456"],
  "reason": "Missing receipts"
}
```

### Database Schema Updates

```sql
-- Add approval fields to expenses table
ALTER TABLE expenses
ADD COLUMN approved_by CHAR(36) NULL,
ADD COLUMN approved_at TIMESTAMP NULL,
ADD COLUMN rejected_by CHAR(36) NULL,
ADD COLUMN rejected_at TIMESTAMP NULL,
ADD COLUMN rejection_reason TEXT NULL,
ADD FOREIGN KEY (approved_by) REFERENCES users(id),
ADD FOREIGN KEY (rejected_by) REFERENCES users(id);

-- Add index for faster queries
ALTER TABLE expenses
ADD INDEX idx_status (status),
ADD INDEX idx_approved_at (approved_at),
ADD INDEX idx_created_at (created_at);
```

### Laravel Controller

```php
// app/Http/Controllers/Api/ExpenseApprovalController.php

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseApprovalController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin,super_admin,supervisor']);
    }

    public function getPending(Request $request)
    {
        $status = $request->input('status', 'pending');

        $query = Expense::with([
            'employee:id,name,employee_id',
            'project:id,name',
            'asset:id,name'
        ])
        ->select([
            'id',
            'employee_id',
            'amount',
            'category',
            'payment_method',
            'status',
            'notes',
            'receipt_key',
            'project_id',
            'asset_id',
            'approved_by',
            'approved_at',
            'rejected_by',
            'rejected_at',
            'rejection_reason',
            'created_at',
            'updated_at'
        ]);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $expenses = $query->orderBy('created_at', 'desc')->get();

        return response()->json($expenses->map(function ($expense) {
            return [
                'id' => $expense->id,
                'amount' => $expense->amount,
                'category' => $expense->category,
                'payment_method' => $expense->payment_method,
                'status' => $expense->status,
                'notes' => $expense->notes,
                'receipt_key' => $expense->receipt_key,
                'created_at' => $expense->created_at->toISOString(),
                'updated_at' => $expense->updated_at->toISOString(),
                'employee_name' => $expense->employee->name ?? 'Unknown',
                'employee_id' => $expense->employee->employee_id ?? 'N/A',
                'project_name' => $expense->project->name ?? null,
                'asset_name' => $expense->asset->name ?? null,
                'approved_by' => $expense->approver->employee_id ?? null,
                'approved_at' => $expense->approved_at?->toISOString(),
                'rejected_by' => $expense->rejector->employee_id ?? null,
                'rejected_at' => $expense->rejected_at?->toISOString(),
                'rejection_reason' => $expense->rejection_reason,
            ];
        }));
    }

    public function getStats()
    {
        $stats = [
            'total_expenses' => Expense::count(),
            'pending' => Expense::where('status', 'pending')->count(),
            'approved' => Expense::where('status', 'approved')->count(),
            'rejected' => Expense::where('status', 'rejected')->count(),
            'approved_amount' => Expense::where('status', 'approved')->sum('amount'),
            'pending_amount' => Expense::where('status', 'pending')->sum('amount'),
            'average_amount' => Expense::where('status', 'approved')->avg('amount') ?? 0,
        ];

        return response()->json($stats);
    }

    public function approve(Request $request, $expenseId)
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $expense = Expense::findOrFail($expenseId);

        if ($expense->status !== 'pending') {
            return response()->json([
                'error' => 'Expense is not pending approval'
            ], 400);
        }

        $expense->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        // TODO: Send notification to employee

        return response()->json([
            'success' => true,
            'message' => 'Expense approved successfully',
            'expense' => $expense->fresh(),
        ]);
    }

    public function reject(Request $request, $expenseId)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $expense = Expense::findOrFail($expenseId);

        if ($expense->status !== 'pending') {
            return response()->json([
                'error' => 'Expense is not pending approval'
            ], 400);
        }

        $expense->update([
            'status' => 'rejected',
            'rejected_by' => auth()->id(),
            'rejected_at' => now(),
            'rejection_reason' => $request->input('reason'),
        ]);

        // TODO: Send notification to employee

        return response()->json([
            'success' => true,
            'message' => 'Expense rejected',
            'expense' => $expense->fresh(),
        ]);
    }

    public function bulkApprove(Request $request)
    {
        $request->validate([
            'expense_ids' => 'required|array',
            'expense_ids.*' => 'uuid|exists:expenses,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $expenseIds = $request->input('expense_ids');

        $updated = Expense::whereIn('id', $expenseIds)
            ->where('status', 'pending')
            ->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} expenses approved successfully",
            'approved_count' => $updated,
        ]);
    }

    public function bulkReject(Request $request)
    {
        $request->validate([
            'expense_ids' => 'required|array',
            'expense_ids.*' => 'uuid|exists:expenses,id',
            'reason' => 'required|string|max:1000',
        ]);

        $expenseIds = $request->input('expense_ids');
        $reason = $request->input('reason');

        $updated = Expense::whereIn('id', $expenseIds)
            ->where('status', 'pending')
            ->update([
                'status' => 'rejected',
                'rejected_by' => auth()->id(),
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} expenses rejected",
            'rejected_count' => $updated,
        ]);
    }
}
```

### Routes

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('expense-approval')->group(function () {
        Route::get('/pending', [ExpenseApprovalController::class, 'getPending']);
        Route::get('/stats', [ExpenseApprovalController::class, 'getStats']);
        Route::post('/approve/{expenseId}', [ExpenseApprovalController::class, 'approve']);
        Route::post('/reject/{expenseId}', [ExpenseApprovalController::class, 'reject']);
        Route::post('/bulk-approve', [ExpenseApprovalController::class, 'bulkApprove']);
        Route::post('/bulk-reject', [ExpenseApprovalController::class, 'bulkReject']);
    });
});
```

### Frontend Integration

**File:** `src/pages/expenses/ExpenseApproval.tsx`

**Changes Required:**
- Endpoints already match (lines 55, 97, 127, 142, 166, 194)
- Remove mock data fallback (lines 62-91, 102-110) once backend is ready

---

## 1.4 QR Code Payload Fix

### Problem

Current implementation uses 6-digit access codes for QR codes, which the PDF generator rejects (see `pdf-generator-simple.ts:358-360`).

### Solution

Backend must provide a verifiable QR payload containing:
- Pass ID
- Validation token
- Expiry timestamp
- Optional: encrypted signature

### Database Schema

```sql
-- Add QR payload fields to gate pass tables
ALTER TABLE visitor_gate_passes
ADD COLUMN qr_payload TEXT NULL,
ADD COLUMN qr_token VARCHAR(100) UNIQUE NULL,
ADD COLUMN qr_expires_at TIMESTAMP NULL;

ALTER TABLE vehicle_entry_passes
ADD COLUMN qr_payload TEXT NULL,
ADD COLUMN qr_token VARCHAR(100) UNIQUE NULL,
ADD COLUMN qr_expires_at TIMESTAMP NULL;

ALTER TABLE vehicle_exit_passes
ADD COLUMN qr_payload TEXT NULL,
ADD COLUMN qr_token VARCHAR(100) UNIQUE NULL,
ADD COLUMN qr_expires_at TIMESTAMP NULL;
```

### Laravel Implementation

```php
// app/Services/QRCodeService.php

<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;

class QRCodeService
{
    /**
     * Generate a secure QR payload for a gate pass
     */
    public static function generatePayload(string $passId, string $passType): array
    {
        $token = Str::random(32);
        $expiresAt = now()->addDays(30); // QR code valid for 30 days

        // Create payload with pass information
        $payload = [
            'pass_id' => $passId,
            'pass_type' => $passType,
            'token' => $token,
            'expires_at' => $expiresAt->timestamp,
            'issued_at' => now()->timestamp,
        ];

        // Encrypt payload for security
        $encryptedPayload = Crypt::encryptString(json_encode($payload));

        // Create validation URL that guards can scan
        $validationUrl = config('app.url') . "/api/gate-pass-validation/verify?token={$token}";

        return [
            'qr_payload' => $validationUrl, // This goes in QR code
            'qr_token' => $token,
            'qr_expires_at' => $expiresAt,
            'encrypted_data' => $encryptedPayload, // Store this in database
        ];
    }

    /**
     * Verify a QR code token
     */
    public static function verifyToken(string $token): ?array
    {
        // Find pass by token
        $pass = null;

        $visitorPass = \App\Models\VisitorGatePass::where('qr_token', $token)->first();
        if ($visitorPass) {
            $pass = $visitorPass;
            $passType = 'visitor';
        } else {
            $vehiclePass = \App\Models\VehicleEntryPass::where('qr_token', $token)->first()
                ?? \App\Models\VehicleExitPass::where('qr_token', $token)->first();
            if ($vehiclePass) {
                $pass = $vehiclePass;
                $passType = 'vehicle';
            }
        }

        if (!$pass) {
            return null;
        }

        // Check if QR code is expired
        if ($pass->qr_expires_at && $pass->qr_expires_at->isPast()) {
            return null;
        }

        return [
            'pass_id' => $pass->id,
            'pass_type' => $passType,
            'pass_number' => $pass->pass_number ?? $pass->reference_number,
            'is_valid' => true,
        ];
    }
}
```

### Update Gate Pass Controllers

```php
// In VisitorGatePassController.php, update the store() method:

use App\Services\QRCodeService;

public function store(Request $request)
{
    // ... existing validation ...

    $pass = VisitorGatePass::create($validatedData);

    // Generate QR payload
    $qrData = QRCodeService::generatePayload($pass->id, 'visitor');

    $pass->update([
        'qr_payload' => $qrData['qr_payload'],
        'qr_token' => $qrData['qr_token'],
        'qr_expires_at' => $qrData['qr_expires_at'],
    ]);

    return response()->json([
        'success' => true,
        'pass' => $pass->fresh(),
        'qr_payload' => $qrData['qr_payload'], // Frontend uses this for QR code
    ], 201);
}
```

### Frontend Integration

Update gate pass creation pages to use `qr_payload` from response:

```typescript
// In CreateVisitorPass.tsx and CreateVehicleMovement.tsx

const response = await axios.post('/api/visitor-gate-passes', data);
const pass = response.data.pass;

// Use the qr_payload instead of access_code
await generatePDFPass({
  passNumber: pass.pass_number,
  passType: 'visitor',
  // ... other fields ...
  qrCode: pass.qr_payload, // ✅ This is now a valid verification URL
  accessCode: pass.access_code // ✅ Keep for display/manual entry
});
```

---

## Phase 1 Summary

### Deliverables

✅ Inspection Dashboard API with real-time stats
✅ Gate Pass Approval workflow (6 endpoints)
✅ Expense Approval workflow (6 endpoints)
✅ QR Code secure payload generation

### Database Changes

- Create `approval_requests` table
- Create `approval_levels` table
- Add approval fields to gate pass tables
- Add approval fields to expenses table
- Add QR payload fields to gate pass tables

### Testing Checklist

- [ ] Inspection dashboard loads with real data
- [ ] Gate pass approval workflow complete cycle
- [ ] Expense approval workflow complete cycle
- [ ] QR codes generate with proper payload
- [ ] QR codes validate correctly at gates
- [ ] Bulk approval operations work
- [ ] Role-based authorization enforced
- [ ] All mock data removed from frontend

### Time Estimate

- Backend API development: 4 days
- Database migrations: 1 day
- Frontend integration: 2 days
- Testing & bug fixes: 2 days
- **Total: 9 days**

---

# Phase 2: Management Dashboards (Week 2-3)

**Goal:** Show real data in analytics and management dashboards

**Priority:** 🟠 HIGH - Incomplete features

**Estimated Time:** 6-8 days

---

## 2.1 Asset Management Dashboard API

### Endpoint: `/api/assets/management`

**Method:** `GET`

### Response

```json
{
  "assets": [
    {
      "id": "uuid-1",
      "name": "Tata Ace #1234",
      "asset_type": "vehicle",
      "purchase_date": "2023-01-15",
      "purchase_value": 500000,
      "current_value": 400000,
      "total_expenses": 45000,
      "expense_count": 23,
      "last_expense_date": "2025-01-15",
      "depreciation_rate": 20,
      "status": "active",
      "maintenance_due": "2025-02-01",
      "recent_expenses": [
        {
          "id": "expense-1",
          "amount": 2500,
          "category": "maintenance",
          "date": "2025-01-15",
          "notes": "Oil change"
        }
      ]
    }
  ],
  "summary": {
    "total_assets": 15,
    "total_value": 7500000,
    "total_expenses": 250000,
    "avg_expense_per_asset": 16666,
    "active_assets": 12,
    "maintenance_due_count": 3
  }
}
```

### Implementation

```php
// app/Http/Controllers/Api/AssetManagementController.php

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Expense;
use Illuminate\Http\Request;

class AssetManagementController extends Controller
{
    public function index(Request $request)
    {
        $assets = Asset::with(['expenses' => function ($query) {
            $query->orderBy('created_at', 'desc')->limit(5);
        }])
        ->withCount('expenses')
        ->withSum('expenses', 'amount')
        ->get();

        $assetsData = $assets->map(function ($asset) {
            return [
                'id' => $asset->id,
                'name' => $asset->name,
                'asset_type' => $asset->asset_type,
                'purchase_date' => $asset->purchase_date,
                'purchase_value' => $asset->purchase_value,
                'current_value' => $asset->current_value,
                'total_expenses' => $asset->expenses_sum_amount ?? 0,
                'expense_count' => $asset->expenses_count,
                'last_expense_date' => $asset->expenses->first()?->created_at,
                'depreciation_rate' => $asset->depreciation_rate,
                'status' => $asset->status,
                'maintenance_due' => $asset->maintenance_due,
                'recent_expenses' => $asset->expenses->map(function ($expense) {
                    return [
                        'id' => $expense->id,
                        'amount' => $expense->amount,
                        'category' => $expense->category,
                        'date' => $expense->created_at->toDateString(),
                        'notes' => $expense->notes,
                    ];
                }),
            ];
        });

        $summary = [
            'total_assets' => Asset::count(),
            'total_value' => Asset::sum('current_value'),
            'total_expenses' => Expense::whereNotNull('asset_id')->sum('amount'),
            'avg_expense_per_asset' => Asset::withSum('expenses', 'amount')
                ->get()
                ->avg('expenses_sum_amount') ?? 0,
            'active_assets' => Asset::where('status', 'active')->count(),
            'maintenance_due_count' => Asset::where('maintenance_due', '<=', now()->addDays(7))->count(),
        ];

        return response()->json([
            'assets' => $assetsData,
            'summary' => $summary,
        ]);
    }
}
```

---

## 2.2 Project Management Dashboard API

### Endpoint: `/api/projects/management`

**Method:** `GET`

### Response

```json
{
  "projects": [
    {
      "id": "uuid-1",
      "name": "Highway Construction - Phase 1",
      "code": "HWY-001",
      "start_date": "2024-01-01",
      "end_date": "2025-06-30",
      "status": "active",
      "budget": 5000000,
      "spent": 2750000,
      "remaining": 2250000,
      "percentage_used": 55,
      "expense_count": 145,
      "last_expense_date": "2025-01-19",
      "team_size": 25,
      "manager": "John Manager",
      "recent_expenses": [
        {
          "id": "expense-1",
          "amount": 15000,
          "category": "materials",
          "date": "2025-01-19",
          "employee": "Worker 1"
        }
      ]
    }
  ],
  "summary": {
    "total_projects": 8,
    "active_projects": 5,
    "total_budget": 25000000,
    "total_spent": 12500000,
    "avg_completion": 62.5,
    "over_budget_count": 1
  }
}
```

---

## 2.3 Cashflow Analysis API

### Endpoint: `/api/expenses/cashflow-analysis`

**Method:** `GET`

**Query Parameters:**
- `period`: `week` | `month` | `quarter` | `year`
- `start_date`: ISO date (optional)
- `end_date`: ISO date (optional)

### Response

```json
{
  "cashflow_data": [
    {
      "date": "2025-01-01",
      "income": 150000,
      "expenses": 85000,
      "net_cashflow": 65000
    }
  ],
  "trends": {
    "weekly_avg_expense": 75000,
    "monthly_avg_expense": 325000,
    "expense_trend": "increasing",
    "trend_percentage": 12.5
  },
  "categories": [
    {
      "category": "fuel",
      "amount": 125000,
      "percentage": 35,
      "count": 245
    }
  ],
  "summary": {
    "total_expenses": 850000,
    "total_income": 1200000,
    "net_profit": 350000,
    "profit_margin": 29.2
  }
}
```

---

## 2.4 Expense Reports API

### Endpoint: `/api/expense-reports/summary`

**Method:** `GET`

**Query Parameters:**
- `start_date`: ISO date
- `end_date`: ISO date
- `category`: expense category (optional)
- `project_id`: project UUID (optional)

### Response

```json
{
  "period": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "summary": {
    "total_expenses": 450000,
    "total_receipts": 387,
    "approved_expenses": 320000,
    "pending_expenses": 85000,
    "rejected_expenses": 45000,
    "avg_expense": 1162,
    "top_category": "fuel",
    "top_employee": "John Smith"
  },
  "by_category": [
    {
      "category": "fuel",
      "amount": 145000,
      "count": 125,
      "percentage": 32.2
    }
  ],
  "by_employee": [
    {
      "employee_id": "EMP001",
      "employee_name": "John Smith",
      "amount": 45000,
      "count": 23,
      "percentage": 10
    }
  ],
  "by_project": [
    {
      "project_id": "uuid-1",
      "project_name": "Highway Construction",
      "amount": 250000,
      "count": 145,
      "percentage": 55.5
    }
  ],
  "timeline": [
    {
      "date": "2025-01-01",
      "amount": 15000,
      "count": 12
    }
  ]
}
```

---

## Phase 2 Summary

### Deliverables

✅ Asset Management Dashboard API
✅ Project Management Dashboard API
✅ Cashflow Analysis API
✅ Expense Reports API

### Database Changes

No major schema changes required. May need:
- Index on `expenses.asset_id`
- Index on `expenses.project_id`
- Index on `expenses.created_at`

### Time Estimate

- Backend API development: 3 days
- Frontend integration: 2 days
- Testing: 2 days
- **Total: 7 days**

---

# Phase 3: Pass Management (Week 3-4)

**Goal:** Complete gate pass management features

**Priority:** 🟡 MEDIUM - Enhance existing features

**Estimated Time:** 6-8 days

---

## 3.1 Gate Pass Templates API

### Endpoints

#### Create Template
**POST** `/api/gate-pass-templates`

```json
{
  "name": "Contractor Visit Template",
  "type": "visitor",
  "purpose": "contractor_work",
  "duration_hours": 8,
  "requires_approval": true,
  "approval_level": 1,
  "default_notes": "Standard contractor pass",
  "is_active": true
}
```

#### List Templates
**GET** `/api/gate-pass-templates`

#### Update Template
**PUT** `/api/gate-pass-templates/{id}`

#### Delete Template
**DELETE** `/api/gate-pass-templates/{id}`

---

## 3.2 Gate Pass Reports API

### Endpoint: `/api/gate-pass-reports/stats`

**Method:** `GET`

```json
{
  "summary": {
    "total_passes_today": 45,
    "total_passes_week": 234,
    "total_passes_month": 987,
    "active_passes": 23,
    "visitor_passes": 156,
    "vehicle_passes": 78
  },
  "trends": {
    "daily_average": 33,
    "peak_hour": "10:00 AM",
    "busiest_day": "Monday"
  },
  "by_purpose": [
    {
      "purpose": "delivery",
      "count": 145,
      "percentage": 35
    }
  ]
}
```

---

## 3.3 Gate Pass Calendar API

### Endpoint: `/api/gate-pass-calendar`

**Method:** `GET`

**Query Parameters:**
- `start_date`: ISO date
- `end_date`: ISO date

```json
{
  "events": [
    {
      "id": "pass-123",
      "pass_number": "VP123456",
      "type": "visitor",
      "title": "John Doe - Inspection",
      "start": "2025-01-21T09:00:00Z",
      "end": "2025-01-21T17:00:00Z",
      "status": "active",
      "visitor_name": "John Doe",
      "purpose": "inspection"
    }
  ]
}
```

---

## 3.4 Visitor Management API

### Endpoints

#### Update Visitor Status
**PUT** `/api/visitor-management/visitors/{id}/status`

```json
{
  "status": "blacklisted",
  "reason": "Security concern",
  "notes": "Unauthorized photography"
}
```

#### Get Visitor Stats
**GET** `/api/visitor-management/stats`

```json
{
  "total_visitors": 1245,
  "active_visitors": 23,
  "blacklisted_visitors": 5,
  "frequent_visitors": 45,
  "new_this_month": 67
}
```

---

## 3.5 Pass Validation API

### Endpoint: `/api/gate-pass-validation/verify`

**Method:** `POST`

```json
{
  "token": "qr-token-from-scan",
  "gate_id": "gate-001",
  "action": "entry"
}
```

### Response

```json
{
  "valid": true,
  "pass": {
    "id": "uuid-123",
    "pass_number": "VP123456",
    "type": "visitor",
    "visitor_name": "John Doe",
    "purpose": "inspection",
    "valid_from": "2025-01-21T09:00:00Z",
    "valid_to": "2025-01-21T17:00:00Z",
    "status": "active",
    "approval_status": "approved"
  },
  "validation": {
    "can_enter": true,
    "message": "Pass is valid",
    "warnings": []
  }
}
```

---

## Phase 3 Summary

### Deliverables

✅ Gate Pass Templates CRUD
✅ Gate Pass Reports API
✅ Gate Pass Calendar API
✅ Visitor Management APIs
✅ Pass Validation API

### Database Changes

```sql
-- Create templates table
CREATE TABLE gate_pass_templates (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('visitor', 'vehicle') NOT NULL,
    purpose VARCHAR(100),
    duration_hours INT DEFAULT 8,
    requires_approval BOOLEAN DEFAULT false,
    approval_level INT DEFAULT 1,
    default_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add visitor blacklist
ALTER TABLE visitor_gate_passes
ADD COLUMN visitor_status ENUM('normal', 'flagged', 'blacklisted') DEFAULT 'normal',
ADD COLUMN blacklist_reason TEXT NULL,
ADD COLUMN blacklisted_at TIMESTAMP NULL,
ADD COLUMN blacklisted_by CHAR(36) NULL,
ADD FOREIGN KEY (blacklisted_by) REFERENCES users(id);
```

### Time Estimate

- Backend API development: 4 days
- Frontend integration: 2 days
- Testing: 2 days
- **Total: 8 days**

---

# Phase 4: Polish & Features (Week 4+)

**Goal:** Production-ready features and enhancements

**Priority:** 🔵 NICE-TO-HAVE

**Estimated Time:** 8-10 days

---

## 4.1 Export Functionality

### Excel/CSV Export

**Endpoints:**
- `POST /api/expenses/export` - Export expenses
- `POST /api/gate-pass/export` - Export gate passes
- `POST /api/inspections/export` - Export inspections

**Libraries:**
- Laravel: `maatwebsite/excel`
- Frontend: `xlsx` (already installed)

---

## 4.2 Notification System

### Email Notifications

**Events:**
- Expense approval/rejection
- Gate pass approval/rejection
- Inspection completion
- System alerts

**Libraries:**
- Laravel: Built-in Mail
- Queue: Redis/Database

---

## 4.3 Real-time Updates

### WebSocket Implementation

**Libraries:**
- Laravel: `beyondcode/laravel-websockets`
- Frontend: `pusher-js` or `socket.io-client`

**Events:**
- New approval request
- Pass validation at gate
- Expense status change

---

## 4.4 Advanced Reporting

### Features

- Custom date ranges
- Filtered reports
- Comparative analysis
- Trend predictions
- Export to PDF/Excel

---

## 4.5 Bulk Operations

### Endpoints

- `POST /api/gate-pass-bulk/import` - Import from CSV/Excel
- `POST /api/gate-pass-bulk/export` - Export bulk passes
- `POST /api/gate-pass-bulk/create` - Create multiple passes

---

## Phase 4 Summary

### Deliverables

✅ Export to Excel/CSV
✅ Email notifications
✅ Real-time updates (WebSocket)
✅ Advanced reporting
✅ Bulk operations

### Time Estimate

- Export functionality: 2 days
- Notifications: 2 days
- Real-time updates: 3 days
- Advanced reporting: 2 days
- Bulk operations: 2 days
- **Total: 11 days**

---

# Database Schema Changes Summary

## New Tables

1. `approval_requests` - Gate pass approval workflow
2. `approval_levels` - Multi-level approval tracking
3. `gate_pass_templates` - Reusable pass templates

## Modified Tables

### visitor_gate_passes
- `qr_payload` TEXT
- `qr_token` VARCHAR(100)
- `qr_expires_at` TIMESTAMP
- `requires_approval` BOOLEAN
- `approval_status` ENUM
- `approval_request_id` CHAR(36)
- `visitor_status` ENUM
- `blacklist_reason` TEXT
- `blacklisted_at` TIMESTAMP
- `blacklisted_by` CHAR(36)

### vehicle_entry_passes & vehicle_exit_passes
- Same QR and approval fields as visitor passes

### expenses
- `approved_by` CHAR(36)
- `approved_at` TIMESTAMP
- `rejected_by` CHAR(36)
- `rejected_at` TIMESTAMP
- `rejection_reason` TEXT

---

# Testing Requirements

## Phase 1 Testing

### Inspection Dashboard
- [ ] Load dashboard with real data
- [ ] Stats calculations correct
- [ ] Recent inspections display
- [ ] Filtering works

### Gate Pass Approval
- [ ] List pending approvals
- [ ] Approve pass
- [ ] Reject pass with reason
- [ ] Escalate to next level
- [ ] Bulk approve/reject
- [ ] Role-based access

### Expense Approval
- [ ] List pending expenses
- [ ] Approve expense
- [ ] Reject expense with reason
- [ ] Bulk operations
- [ ] Stats calculation

### QR Codes
- [ ] Generate with proper payload
- [ ] Scan and validate
- [ ] Expired QR codes rejected
- [ ] Invalid tokens rejected

## Phase 2 Testing

### Asset Management
- [ ] List all assets
- [ ] Calculate total expenses
- [ ] Recent expenses display
- [ ] Summary stats correct

### Project Management
- [ ] List all projects
- [ ] Budget calculations
- [ ] Expense tracking
- [ ] Over-budget alerts

### Cashflow Analysis
- [ ] Period filtering
- [ ] Trend calculations
- [ ] Category breakdown
- [ ] Timeline display

### Expense Reports
- [ ] Date range filtering
- [ ] Category filtering
- [ ] Employee breakdown
- [ ] Project breakdown

## Phase 3 Testing

### Templates
- [ ] Create template
- [ ] Use template for pass
- [ ] Update template
- [ ] Delete template

### Reports
- [ ] Generate reports
- [ ] Filter by date
- [ ] Export functionality

### Calendar
- [ ] Display passes
- [ ] Filter by type
- [ ] Navigate months

### Visitor Management
- [ ] Update visitor status
- [ ] Blacklist visitor
- [ ] View visitor history

---

# Deployment Checklist

## Backend

- [ ] Run all migrations
- [ ] Seed initial data if needed
- [ ] Configure queue workers
- [ ] Set up Laravel Scheduler
- [ ] Configure mail settings
- [ ] Set up Redis (if using)
- [ ] Configure storage (Cloudflare R2)
- [ ] Set environment variables
- [ ] Run `php artisan optimize`
- [ ] Set up SSL certificate

## Frontend

- [ ] Update API_BASE_URL in .env.production
- [ ] Remove all mock data fallbacks
- [ ] Build production bundle
- [ ] Test service workers
- [ ] Test offline functionality
- [ ] Configure PWA manifest
- [ ] Set up analytics (optional)
- [ ] Test on mobile devices

## Database

- [ ] Backup production database
- [ ] Run migrations
- [ ] Add indexes for performance
- [ ] Set up automated backups

## Testing

- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security testing
- [ ] Mobile testing
- [ ] Offline testing

---

# Timeline Summary

| Phase | Duration | Priority | Deliverables |
|-------|----------|----------|--------------|
| **Phase 1** | 9 days | 🔴 Critical | Approval workflows, Inspection dashboard, QR codes |
| **Phase 2** | 7 days | 🟠 High | Management dashboards, Analytics |
| **Phase 3** | 8 days | 🟡 Medium | Pass management, Templates, Validation |
| **Phase 4** | 11 days | 🔵 Nice-to-have | Exports, Notifications, Real-time |

**Total Development Time: 35 days (7 weeks)**

---

# Success Criteria

## Phase 1 Complete When:
✅ All approval workflows functional
✅ Inspection dashboard shows real data
✅ QR codes validate correctly
✅ No mock data in critical paths

## Phase 2 Complete When:
✅ All management dashboards show real data
✅ Analytics calculate correctly
✅ Reports generate accurately

## Phase 3 Complete When:
✅ Templates system functional
✅ Pass validation working
✅ Calendar displays correctly
✅ Visitor management complete

## Phase 4 Complete When:
✅ Export functionality works
✅ Notifications send
✅ Real-time updates work
✅ Bulk operations functional

---

# Notes for Developers

1. **Use Transactions:** Wrap multi-step operations in database transactions
2. **Validate Roles:** Always check user roles/permissions
3. **Log Important Actions:** Log approvals, rejections, and validations
4. **Error Handling:** Return consistent error formats
5. **API Versioning:** Use `/api/v1/` prefix for versioning
6. **Rate Limiting:** Apply rate limits to prevent abuse
7. **CORS:** Configure properly for frontend
8. **Testing:** Write unit tests for critical functions
9. **Documentation:** Document all endpoints in Postman/Swagger

---

**End of Implementation Plan**

For questions or clarifications, please refer to the specific sections above or contact the development team.
