<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ExpenseApprovalController extends Controller
{
    /**
     * List expenses with status filter
     * GET /api/expense-approval/pending
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $status = $request->get('status', 'pending');
            
            $query = DB::table('expenses')
                ->leftJoin('users', 'expenses.user_id', '=', 'users.id')
                ->leftJoin('projects', 'expenses.project_id', '=', 'projects.id')
                ->leftJoin('assets', 'expenses.asset_id', '=', 'assets.id')
                ->select(
                    'expenses.*',
                    'users.name as employee_name',
                    'users.employee_id as employee_id',
                    'projects.name as project_name',
                    'assets.name as asset_name'
                )
                ->orderBy('expenses.created_at', 'desc');
            
            if ($status !== 'all') {
                $query->where('expenses.status', $status);
            }
            
            $expenses = $query->get()->map(function ($expense) {
                return [
                    'id' => $expense->id,
                    'amount' => (float) $expense->amount,
                    'category' => $expense->category,
                    'payment_method' => $expense->payment_method,
                    'status' => $expense->status,
                    'notes' => $expense->notes ?? '',
                    'receipt_key' => $expense->receipt_key ?? null,
                    'created_at' => $expense->created_at,
                    'updated_at' => $expense->updated_at,
                    'employee_name' => $expense->employee_name ?? 'N/A',
                    'employee_id' => $expense->employee_id ?? 'N/A',
                    'project_name' => $expense->project_name ?? null,
                    'asset_name' => $expense->asset_name ?? null,
                    'approved_by' => $expense->approved_by ?? null,
                    'approved_at' => $expense->approved_at ?? null,
                    'rejected_by' => $expense->rejected_by ?? null,
                    'rejected_at' => $expense->rejected_at ?? null,
                    'rejection_reason' => $expense->rejection_reason ?? null
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $expenses
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching expenses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expenses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approval statistics
     * GET /api/expense-approval/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total_expenses' => DB::table('expenses')->count(),
                'pending' => DB::table('expenses')->where('status', 'pending')->count(),
                'approved' => DB::table('expenses')->where('status', 'approved')->count(),
                'rejected' => DB::table('expenses')->where('status', 'rejected')->count(),
                'approved_amount' => (float) DB::table('expenses')
                    ->where('status', 'approved')
                    ->sum('amount'),
                'pending_amount' => (float) DB::table('expenses')
                    ->where('status', 'pending')
                    ->sum('amount'),
                'average_amount' => (float) DB::table('expenses')
                    ->avg('amount')
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching expense stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an expense
     * POST /api/expense-approval/approve/{expenseId}
     */
    public function approve(Request $request, string $expenseId): JsonResponse
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
            
            $user = $request->user();
            
            $expense = DB::table('expenses')->where('id', $expenseId)->first();
            
            if (!$expense) {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense not found'
                ], 404);
            }
            
            if ($expense->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense is not pending approval'
                ], 400);
            }
            
            // Update expense
            DB::table('expenses')
                ->where('id', $expenseId)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'updated_at' => now()
                ]);
            
            Log::info('Expense approved', [
                'expense_id' => $expenseId,
                'approved_by' => $user->id
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Expense approved successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve expense',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an expense
     * POST /api/expense-approval/reject/{expenseId}
     */
    public function reject(Request $request, string $expenseId): JsonResponse
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
            
            $user = $request->user();
            
            $expense = DB::table('expenses')->where('id', $expenseId)->first();
            
            if (!$expense) {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense not found'
                ], 404);
            }
            
            if ($expense->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense is not pending approval'
                ], 400);
            }
            
            // Update expense
            DB::table('expenses')
                ->where('id', $expenseId)
                ->update([
                    'status' => 'rejected',
                    'rejected_by' => $user->id,
                    'rejected_at' => now(),
                    'rejection_reason' => $request->input('reason'),
                    'updated_at' => now()
                ]);
            
            Log::info('Expense rejected', [
                'expense_id' => $expenseId,
                'rejected_by' => $user->id
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Expense rejected successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error rejecting expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject expense',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk approve expenses
     * POST /api/expense-approval/bulk-approve
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'expense_ids' => 'required|array|min:1',
            'expense_ids.*' => 'required|string|exists:expenses,id',
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
            
            $user = $request->user();
            $expenseIds = $request->input('expense_ids');
            
            // Verify all expenses are pending
            $pendingCount = DB::table('expenses')
                ->whereIn('id', $expenseIds)
                ->where('status', 'pending')
                ->count();
            
            if ($pendingCount !== count($expenseIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Some expenses are not pending approval'
                ], 400);
            }
            
            // Update all expenses
            DB::table('expenses')
                ->whereIn('id', $expenseIds)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'updated_at' => now()
                ]);
            
            Log::info('Expenses bulk approved', [
                'expense_ids' => $expenseIds,
                'approved_by' => $user->id,
                'count' => count($expenseIds)
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => count($expenseIds) . ' expense(s) approved successfully',
                'data' => [
                    'approved_count' => count($expenseIds)
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error bulk approving expenses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk approve expenses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk reject expenses
     * POST /api/expense-approval/bulk-reject
     */
    public function bulkReject(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'expense_ids' => 'required|array|min:1',
            'expense_ids.*' => 'required|string|exists:expenses,id',
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
            
            $user = $request->user();
            $expenseIds = $request->input('expense_ids');
            
            // Verify all expenses are pending
            $pendingCount = DB::table('expenses')
                ->whereIn('id', $expenseIds)
                ->where('status', 'pending')
                ->count();
            
            if ($pendingCount !== count($expenseIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Some expenses are not pending approval'
                ], 400);
            }
            
            // Update all expenses
            DB::table('expenses')
                ->whereIn('id', $expenseIds)
                ->update([
                    'status' => 'rejected',
                    'rejected_by' => $user->id,
                    'rejected_at' => now(),
                    'rejection_reason' => $request->input('reason'),
                    'updated_at' => now()
                ]);
            
            Log::info('Expenses bulk rejected', [
                'expense_ids' => $expenseIds,
                'rejected_by' => $user->id,
                'count' => count($expenseIds)
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => count($expenseIds) . ' expense(s) rejected successfully',
                'data' => [
                    'rejected_count' => count($expenseIds)
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error bulk rejecting expenses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk reject expenses',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

