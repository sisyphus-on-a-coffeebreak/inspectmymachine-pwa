<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GatePass;
use App\Models\GatePassApproval;
use App\Models\GatePassApprovalComment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GatePassApprovalController extends Controller
{
    /**
     * Get pending approval requests
     */
    public function pending(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');
        
        $query = GatePassApproval::with(['gatePass', 'requester', 'currentApprover'])
            ->where('status', $status);

        // Filter by current approver if user is approver
        if ($request->user() && $status === 'pending') {
            $user = $request->user();
            $query->where(function ($q) use ($user) {
                $q->where('current_approver_id', $user->id)
                  ->orWhere('current_approver_role', $user->role);
            });
        }

        $approvals = $query->orderBy('created_at', 'desc')->get();

        // Transform to match frontend interface
        $data = $approvals->map(function ($approval) {
            $gatePass = $approval->gatePass;
            $currentApprover = $approval->currentApprover;
            
            return [
                'id' => $approval->id,
                'pass_id' => $approval->gate_pass_id,
                'pass_number' => $gatePass ? $gatePass->pass_number : 'N/A',
                'pass_type' => $gatePass ? ($gatePass->pass_type === 'visitor' ? 'visitor' : 'vehicle') : 'visitor',
                'requester_name' => $approval->requester_name,
                'requester_id' => (string) $approval->requester_id,
                'request_date' => ($approval->requested_at ?? $approval->created_at)->toISOString(),
                'approval_level' => $approval->approval_level,
                'current_approver' => $currentApprover ? $currentApprover->name : ($approval->current_approver_role ?? 'N/A'),
                'status' => $approval->status,
                'approval_notes' => $approval->approval_notes,
                'rejection_reason' => $approval->rejection_reason,
                'escalation_reason' => $approval->escalation_reason,
                'created_at' => $approval->created_at->toISOString(),
                'updated_at' => $approval->updated_at->toISOString(),
            ];
        });

        return response()->json($data);
    }

    /**
     * Get pass details for approval
     */
    public function passDetails(string $passId): JsonResponse
    {
        // Handle both UUID and pass_number
        $gatePass = GatePass::where('id', $passId)
            ->orWhere('pass_number', $passId)
            ->with(['creator', 'vehicle'])
            ->first();

        if (!$gatePass) {
            return response()->json(['error' => 'Gate pass not found'], 404);
        }

        // Transform to match frontend interface
        $data = [
            'id' => $gatePass->id,
            'pass_number' => $gatePass->pass_number,
            'type' => $gatePass->pass_type === 'visitor' ? 'visitor' : 'vehicle',
            'visitor_name' => $gatePass->visitor_name,
            'vehicle_registration' => $gatePass->vehicle ? $gatePass->vehicle->registration_number : null,
            'purpose' => $gatePass->purpose,
            'valid_from' => $gatePass->valid_from->toISOString(),
            'valid_to' => $gatePass->valid_to->toISOString(),
            'requester_name' => $gatePass->creator ? $gatePass->creator->name : 'Unknown',
            'request_notes' => $gatePass->notes,
            'urgency' => $this->calculateUrgency($gatePass),
        ];

        return response()->json($data);
    }

    /**
     * Get approval history/levels
     */
    public function history(Request $request): JsonResponse
    {
        $approvalId = $request->input('approval_id');
        $passId = $request->input('pass_id');
        
        // If no approval_id, try to find approval by pass_id
        if (!$approvalId && $passId) {
            // Handle both UUID and pass_number
            $approval = GatePassApproval::where('gate_pass_id', $passId)
                ->orWhereHas('gatePass', function ($q) use ($passId) {
                    $q->where('pass_number', $passId);
                })
                ->orderBy('created_at', 'desc')
                ->first();
            $approvalId = $approval ? $approval->id : null;
        }
        
        if (!$approvalId) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        $approval = GatePassApproval::with(['currentApprover'])->find($approvalId);
        
        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        // Build approval levels based on current status
        $levels = [];
        for ($i = 1; $i <= 3; $i++) {
            $levels[] = [
                'level' => $i,
                'approver_role' => $i === 1 ? 'supervisor' : ($i === 2 ? 'admin' : 'super_admin'),
                'approver_name' => $i === $approval->approval_level && $approval->currentApprover 
                    ? $approval->currentApprover->name 
                    : null,
                'required' => $i <= 2,
                'status' => $i < $approval->approval_level ? 'approved' 
                    : ($i === $approval->approval_level ? $approval->status 
                    : 'pending'),
            ];
        }

        return response()->json($levels);
    }

    /**
     * Get comments for an approval
     */
    public function getComments(string $approvalId): JsonResponse
    {
        $approval = GatePassApproval::find($approvalId);
        
        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        $comments = GatePassApprovalComment::with(['author', 'replies'])
            ->where('approval_id', $approvalId)
            ->whereNull('parent_id') // Top-level comments only
            ->orderBy('created_at', 'asc')
            ->get();

        $transformed = $comments->map(function ($comment) {
            return [
                'id' => $comment->id,
                'author_id' => (string) $comment->author_id,
                'author_name' => $comment->author_name,
                'author_role' => $comment->author_role,
                'content' => $comment->content,
                'created_at' => $comment->created_at->toISOString(),
                'mentions' => $comment->mentions ?? [],
                'parent_id' => $comment->parent_id,
            ];
        });

        return response()->json(['comments' => $transformed]);
    }

    /**
     * Add a comment to an approval
     */
    public function addComment(Request $request, string $approvalId): JsonResponse
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'mentions' => 'nullable|array',
            'mentions.*' => 'string',
        ]);

        $approval = GatePassApproval::find($approvalId);
        
        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        $user = $request->user();

        $comment = GatePassApprovalComment::create([
            'approval_id' => $approvalId,
            'author_id' => $user->id,
            'author_name' => $user->name ?? $user->email,
            'author_role' => $user->role,
            'content' => $request->input('content'),
            'mentions' => $request->input('mentions', []),
            'parent_id' => $request->input('parent_id'),
        ]);

        return response()->json([
            'comment' => [
                'id' => $comment->id,
                'author_id' => (string) $comment->author_id,
                'author_name' => $comment->author_name,
                'author_role' => $comment->author_role,
                'content' => $comment->content,
                'created_at' => $comment->created_at->toISOString(),
                'mentions' => $comment->mentions ?? [],
            ],
        ], 201);
    }

    /**
     * Approve a gate pass
     */
    public function approve(Request $request, string $approvalId): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $approval = GatePassApproval::with('gatePass')->find($approvalId);
        
        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        $user = $request->user();

        DB::transaction(function () use ($approval, $user, $request) {
            $approval->update([
                'approval_notes' => $request->input('notes'),
                'approved_at' => now(),
            ]);

            // Check if needs escalation
            if ($approval->approval_level < 3) {
                // Escalate to next level
                $approval->update([
                    'status' => 'escalated',
                    'approval_level' => $approval->approval_level + 1,
                    'current_approver_id' => null, // Will be assigned based on role
                    'current_approver_role' => $approval->approval_level === 2 ? 'admin' : 'super_admin',
                ]);
            } else {
                // Final approval - activate the gate pass
                $approval->update(['status' => 'approved']);
                if ($approval->gatePass) {
                    $approval->gatePass->update(['status' => 'active']);
                }
            }
        });

        return response()->json(['message' => 'Approval processed successfully']);
    }

    /**
     * Reject a gate pass
     */
    public function reject(Request $request, string $approvalId): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $approval = GatePassApproval::with('gatePass')->find($approvalId);
        
        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        DB::transaction(function () use ($approval, $request) {
            $approval->update([
                'status' => 'rejected',
                'rejection_reason' => $request->input('reason'),
                'rejected_at' => now(),
            ]);

            if ($approval->gatePass) {
                $approval->gatePass->update(['status' => 'rejected']);
            }
        });

        return response()->json(['message' => 'Approval rejected']);
    }

    /**
     * Calculate urgency based on pass validity
     */
    private function calculateUrgency(GatePass $gatePass): string
    {
        $hoursUntilValid = now()->diffInHours($gatePass->valid_from, false);
        
        if ($hoursUntilValid < 0) {
            return 'urgent'; // Already past valid_from
        } elseif ($hoursUntilValid < 2) {
            return 'high';
        } elseif ($hoursUntilValid < 24) {
            return 'medium';
        }
        
        return 'low';
    }
}
