<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\ApprovalLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class GatePassApprovalController extends Controller
{
    /**
     * List pending approval requests
     * GET /api/gate-pass-approval/pending
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $status = $request->get('status', 'pending');
            
            $query = ApprovalRequest::with(['requester:id,name,employee_id', 'approver:id,name', 'rejector:id,name'])
                ->orderBy('created_at', 'desc');
            
            if ($status !== 'all') {
                $query->where('status', $status);
            }
            
            $requests = $query->get()->map(function ($request) {
                // Get pass details based on pass_type
                $passDetails = $this->getPassDetails($request->pass_id, $request->pass_type);
                
                return [
                    'id' => $request->id,
                    'pass_id' => $request->pass_id,
                    'pass_number' => $passDetails['pass_number'] ?? 'N/A',
                    'pass_type' => $request->pass_type,
                    'requester_name' => $request->requester->name ?? 'N/A',
                    'requester_id' => $request->requester_id,
                    'request_date' => $request->created_at->toISOString(),
                    'approval_level' => $request->approval_level,
                    'current_approver' => $request->current_approver_role ?? 'N/A',
                    'status' => $request->status,
                    'approval_notes' => $request->approval_notes,
                    'rejection_reason' => $request->rejection_reason,
                    'escalation_reason' => $request->escalation_reason,
                    'created_at' => $request->created_at->toISOString(),
                    'updated_at' => $request->updated_at->toISOString()
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pending approvals: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approval requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pass details for an approval request
     * GET /api/gate-pass-approval/pass-details/{passId}
     */
    public function passDetails(string $passId): JsonResponse
    {
        try {
            // Try to find the pass in any of the gate pass tables
            $passDetails = $this->getPassDetails($passId, null);
            
            if (!$passDetails) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pass not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $passDetails
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pass details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pass details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approval history for a request
     * GET /api/gate-pass-approval/history/{approvalRequestId}
     */
    public function history(string $approvalRequestId): JsonResponse
    {
        try {
            $approvalRequest = ApprovalRequest::with(['levels.approver:id,name'])
                ->findOrFail($approvalRequestId);
            
            $levels = $approvalRequest->levels->map(function ($level) {
                return [
                    'level' => $level->level,
                    'approver_role' => $level->approver_role,
                    'approver_name' => $level->approver->name ?? 'N/A',
                    'required' => $level->required,
                    'status' => $level->status,
                    'approved_at' => $level->approved_at ? $level->approved_at->toISOString() : null,
                    'notes' => $level->notes
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $levels
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching approval history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approval history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a gate pass
     * POST /api/gate-pass-approval/approve/{approvalRequestId}
     */
    public function approve(Request $request, string $approvalRequestId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:1000'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $approvalRequest = ApprovalRequest::findOrFail($approvalRequestId);
            $user = $request->user();
            
            // Check if already approved or rejected
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Request is not pending approval'
                ], 400);
            }
            
            // Update approval request
            $approvalRequest->status = 'approved';
            $approvalRequest->approved_by = $user->id;
            $approvalRequest->approved_at = now();
            $approvalRequest->approval_notes = $request->input('notes');
            $approvalRequest->save();
            
            // Update current approval level
            $currentLevel = ApprovalLevel::where('approval_request_id', $approvalRequest->id)
                ->where('level', $approvalRequest->approval_level)
                ->first();
            
            if ($currentLevel) {
                $currentLevel->status = 'approved';
                $currentLevel->approver_id = $user->id;
                $currentLevel->approved_at = now();
                $currentLevel->notes = $request->input('notes');
                $currentLevel->save();
            }
            
            // Update the gate pass approval status
            $this->updateGatePassApprovalStatus($approvalRequest->pass_id, $approvalRequest->pass_type, 'approved');
            
            Log::info('Gate pass approved', [
                'approval_request_id' => $approvalRequest->id,
                'pass_id' => $approvalRequest->pass_id,
                'approved_by' => $user->id
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Gate pass approved successfully',
                'data' => $approvalRequest
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving gate pass: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve gate pass',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a gate pass
     * POST /api/gate-pass-approval/reject/{approvalRequestId}
     */
    public function reject(Request $request, string $approvalRequestId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:1000'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $approvalRequest = ApprovalRequest::findOrFail($approvalRequestId);
            $user = $request->user();
            
            // Check if already approved or rejected
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Request is not pending approval'
                ], 400);
            }
            
            // Update approval request
            $approvalRequest->status = 'rejected';
            $approvalRequest->rejected_by = $user->id;
            $approvalRequest->rejected_at = now();
            $approvalRequest->rejection_reason = $request->input('reason');
            $approvalRequest->save();
            
            // Update current approval level
            $currentLevel = ApprovalLevel::where('approval_request_id', $approvalRequest->id)
                ->where('level', $approvalRequest->approval_level)
                ->first();
            
            if ($currentLevel) {
                $currentLevel->status = 'rejected';
                $currentLevel->approver_id = $user->id;
                $currentLevel->notes = $request->input('reason');
                $currentLevel->save();
            }
            
            // Update the gate pass approval status
            $this->updateGatePassApprovalStatus($approvalRequest->pass_id, $approvalRequest->pass_type, 'rejected');
            
            Log::info('Gate pass rejected', [
                'approval_request_id' => $approvalRequest->id,
                'pass_id' => $approvalRequest->pass_id,
                'rejected_by' => $user->id
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Gate pass rejected successfully',
                'data' => $approvalRequest
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error rejecting gate pass: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject gate pass',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Escalate approval to next level
     * POST /api/gate-pass-approval/escalate/{approvalRequestId}
     */
    public function escalate(Request $request, string $approvalRequestId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:1000'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $approvalRequest = ApprovalRequest::findOrFail($approvalRequestId);
            
            // Check if already approved or rejected
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Request is not pending approval'
                ], 400);
            }
            
            // Find next approval level
            $nextLevel = ApprovalLevel::where('approval_request_id', $approvalRequest->id)
                ->where('level', '>', $approvalRequest->approval_level)
                ->orderBy('level', 'asc')
                ->first();
            
            if (!$nextLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'No next approval level available'
                ], 400);
            }
            
            // Update approval request
            $approvalRequest->status = 'escalated';
            $approvalRequest->approval_level = $nextLevel->level;
            $approvalRequest->current_approver_role = $nextLevel->approver_role;
            $approvalRequest->escalation_reason = $request->input('reason');
            $approvalRequest->save();
            
            Log::info('Gate pass escalated', [
                'approval_request_id' => $approvalRequest->id,
                'new_level' => $nextLevel->level
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Gate pass escalated successfully',
                'data' => $approvalRequest
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error escalating gate pass: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to escalate gate pass',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to get pass details from database
     */
    private function getPassDetails(string $passId, ?string $passType): ?array
    {
        // If pass_type is provided, check that specific table
        if ($passType === 'visitor') {
            $pass = DB::table('visitor_gate_passes')->where('id', $passId)->first();
            if ($pass) {
                return [
                    'id' => $pass->id,
                    'pass_number' => $pass->pass_number ?? null,
                    'type' => 'visitor',
                    'visitor_name' => $pass->visitor_name ?? null,
                    'purpose' => $pass->purpose ?? null,
                    'valid_from' => $pass->valid_from ?? null,
                    'valid_to' => $pass->valid_to ?? null,
                    'requester_name' => 'N/A', // Would need to join with users table
                    'request_notes' => $pass->notes ?? null,
                    'urgency' => 'medium' // Default, could be calculated
                ];
            }
        } elseif ($passType === 'vehicle') {
            // Check both entry and exit passes
            $entryPass = DB::table('vehicle_entry_passes')->where('id', $passId)->first();
            if ($entryPass) {
                return [
                    'id' => $entryPass->id,
                    'pass_number' => $entryPass->pass_number ?? null,
                    'type' => 'vehicle',
                    'vehicle_registration' => null, // Would need to join with vehicles table
                    'purpose' => $entryPass->purpose ?? null,
                    'valid_from' => $entryPass->valid_from ?? null,
                    'valid_to' => $entryPass->valid_to ?? null,
                    'requester_name' => 'N/A',
                    'request_notes' => $entryPass->notes ?? null,
                    'urgency' => 'medium'
                ];
            }
            
            $exitPass = DB::table('vehicle_exit_passes')->where('id', $passId)->first();
            if ($exitPass) {
                return [
                    'id' => $exitPass->id,
                    'pass_number' => $exitPass->pass_number ?? null,
                    'type' => 'vehicle',
                    'vehicle_registration' => null,
                    'purpose' => $exitPass->purpose ?? null,
                    'valid_from' => $exitPass->valid_from ?? null,
                    'valid_to' => $exitPass->valid_to ?? null,
                    'requester_name' => 'N/A',
                    'request_notes' => $exitPass->notes ?? null,
                    'urgency' => 'medium'
                ];
            }
        } else {
            // Try all tables
            $visitorPass = DB::table('visitor_gate_passes')->where('id', $passId)->first();
            if ($visitorPass) {
                return $this->getPassDetails($passId, 'visitor');
            }
            
            $entryPass = DB::table('vehicle_entry_passes')->where('id', $passId)->first();
            if ($entryPass) {
                return $this->getPassDetails($passId, 'vehicle');
            }
            
            $exitPass = DB::table('vehicle_exit_passes')->where('id', $passId)->first();
            if ($exitPass) {
                return $this->getPassDetails($passId, 'vehicle');
            }
        }
        
        return null;
    }

    /**
     * Helper method to update gate pass approval status
     */
    private function updateGatePassApprovalStatus(string $passId, string $passType, string $status): void
    {
        $tableName = match($passType) {
            'visitor' => 'visitor_gate_passes',
            'vehicle' => 'vehicle_entry_passes', // Default to entry, could check both
            default => null
        };
        
        if ($tableName) {
            DB::table($tableName)
                ->where('id', $passId)
                ->update([
                    'approval_status' => $status,
                    'updated_at' => now()
                ]);
        }
        
        // Also check vehicle_exit_passes if it's a vehicle type
        if ($passType === 'vehicle') {
            DB::table('vehicle_exit_passes')
                ->where('id', $passId)
                ->update([
                    'approval_status' => $status,
                    'updated_at' => now()
                ]);
        }
    }
}

