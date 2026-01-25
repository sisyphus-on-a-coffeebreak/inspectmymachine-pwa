<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Task Controller
 * 
 * Handles task management endpoints for workflow automation
 * Tasks include: clerking sheets, maintenance jobs, reconciliations, etc.
 */
class TaskController extends Controller
{
    /**
     * Get list of tasks with optional filters
     * 
     * GET /api/v1/tasks
     * 
     * Query Parameters:
     * - assigned_to: Filter by assigned user ID
     * - created_by: Filter by creator user ID
     * - status: Filter by status (pending, in_progress, completed, cancelled, overdue)
     * - priority: Filter by priority (low, medium, high, critical)
     * - type: Filter by task type
     * - related_entity_type: Filter by related entity type
     * - related_entity_id: Filter by related entity ID
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = DB::table('tasks')
            ->leftJoin('users as assigned_user', 'tasks.assigned_to_id', '=', 'assigned_user.id')
            ->leftJoin('users as created_user', 'tasks.created_by_id', '=', 'created_user.id')
            ->select(
                'tasks.*',
                'assigned_user.id as assigned_to_id',
                'assigned_user.name as assigned_to_name',
                'assigned_user.email as assigned_to_email',
                'created_user.id as created_by_id',
                'created_user.name as created_by_name'
            );

        // Apply filters
        if ($request->has('assigned_to')) {
            $query->where('tasks.assigned_to_id', $request->assigned_to);
        }

        if ($request->has('created_by')) {
            $query->where('tasks.created_by_id', $request->created_by);
        }

        if ($request->has('status')) {
            $query->where('tasks.status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('tasks.priority', $request->priority);
        }

        if ($request->has('type')) {
            $query->where('tasks.type', $request->type);
        }

        if ($request->has('related_entity_type')) {
            $query->where('tasks.related_entity_type', $request->related_entity_type);
        }

        if ($request->has('related_entity_id')) {
            $query->where('tasks.related_entity_id', $request->related_entity_id);
        }

        // Default: show tasks assigned to current user or created by current user
        if (!$request->has('assigned_to') && !$request->has('created_by')) {
            $query->where(function ($q) use ($user) {
                $q->where('tasks.assigned_to_id', $user->id)
                  ->orWhere('tasks.created_by_id', $user->id);
            });
        }

        $tasks = $query->orderBy('tasks.created_at', 'desc')->get();

        // Transform to API format
        $transformed = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'type' => $task->type,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'priority' => $task->priority,
                'assigned_to' => $task->assigned_to_id ? [
                    'id' => $task->assigned_to_id,
                    'name' => $task->assigned_to_name,
                    'email' => $task->assigned_to_email,
                ] : null,
                'created_by' => $task->created_by_id ? [
                    'id' => $task->created_by_id,
                    'name' => $task->created_by_name,
                ] : null,
                'created_at' => $task->created_at,
                'updated_at' => $task->updated_at,
                'due_date' => $task->due_date,
                'completed_at' => $task->completed_at,
                'metadata' => json_decode($task->metadata ?? '{}', true),
                'related_entity' => $task->related_entity_type ? [
                    'type' => $task->related_entity_type,
                    'id' => $task->related_entity_id,
                ] : null,
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Get a single task by ID
     * 
     * GET /api/v1/tasks/{id}
     */
    public function show(string $id): JsonResponse
    {
        $user = Auth::user();

        $task = DB::table('tasks')
            ->leftJoin('users as assigned_user', 'tasks.assigned_to_id', '=', 'assigned_user.id')
            ->leftJoin('users as created_user', 'tasks.created_by_id', '=', 'created_user.id')
            ->where('tasks.id', $id)
            ->where(function ($q) use ($user) {
                $q->where('tasks.assigned_to_id', $user->id)
                  ->orWhere('tasks.created_by_id', $user->id);
            })
            ->select(
                'tasks.*',
                'assigned_user.id as assigned_to_id',
                'assigned_user.name as assigned_to_name',
                'assigned_user.email as assigned_to_email',
                'created_user.id as created_by_id',
                'created_user.name as created_by_name'
            )
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        return response()->json([
            'id' => $task->id,
            'type' => $task->type,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'priority' => $task->priority,
            'assigned_to' => $task->assigned_to_id ? [
                'id' => $task->assigned_to_id,
                'name' => $task->assigned_to_name,
                'email' => $task->assigned_to_email,
            ] : null,
            'created_by' => $task->created_by_id ? [
                'id' => $task->created_by_id,
                'name' => $task->created_by_name,
            ] : null,
            'created_at' => $task->created_at,
            'updated_at' => $task->updated_at,
            'due_date' => $task->due_date,
            'completed_at' => $task->completed_at,
            'metadata' => json_decode($task->metadata ?? '{}', true),
            'related_entity' => $task->related_entity_type ? [
                'type' => $task->related_entity_type,
                'id' => $task->related_entity_id,
            ] : null,
        ]);
    }

    /**
     * Create a new task
     * 
     * POST /api/v1/tasks
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:clerking_sheet,component_accounting,maintenance_job_card,reconciliation,inspection_review,advance_approval,status_change_approval,custom',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:pending,in_progress,completed,cancelled,overdue',
            'priority' => 'nullable|string|in:low,medium,high,critical',
            'assigned_to_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'metadata' => 'nullable|array',
            'related_entity_type' => 'nullable|string|in:vehicle,expense,inspection,gate_pass,component,advance',
            'related_entity_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        $taskId = DB::table('tasks')->insertGetId([
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'status' => $request->status ?? 'pending',
            'priority' => $request->priority ?? 'medium',
            'assigned_to_id' => $request->assigned_to_id,
            'created_by_id' => $user->id,
            'due_date' => $request->due_date,
            'metadata' => json_encode($request->metadata ?? []),
            'related_entity_type' => $request->related_entity_type,
            'related_entity_id' => $request->related_entity_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->show($taskId);
    }

    /**
     * Update task status
     * 
     * PATCH /api/v1/tasks/{id}/status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,in_progress,completed,cancelled,overdue',
            'updated_by_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $updateData = [
            'status' => $request->status,
            'updated_at' => now(),
        ];

        if ($request->status === 'completed') {
            $updateData['completed_at'] = now();
        }

        $updated = DB::table('tasks')
            ->where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('assigned_to_id', $user->id)
                  ->orWhere('created_by_id', $user->id);
            })
            ->update($updateData);

        if (!$updated) {
            return response()->json(['error' => 'Task not found or unauthorized'], 404);
        }

        return $this->show($id);
    }

    /**
     * Assign task to a user
     * 
     * POST /api/v1/tasks/{id}/assign
     */
    public function assign(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'assigned_to_id' => 'required|exists:users,id',
            'assigned_by_id' => 'required|exists:users,id',
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        // Check if user can assign (must be creator or current assignee)
        $task = DB::table('tasks')->where('id', $id)->first();
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        if ($task->created_by_id != $user->id && $task->assigned_to_id != $user->id) {
            return response()->json(['error' => 'Unauthorized to assign this task'], 403);
        }

        DB::table('tasks')
            ->where('id', $id)
            ->update([
                'assigned_to_id' => $request->assigned_to_id,
                'updated_at' => now(),
            ]);

        // Record assignment history
        DB::table('task_assignments')->insert([
            'task_id' => $id,
            'assigned_to_id' => $request->assigned_to_id,
            'assigned_by_id' => $request->assigned_by_id,
            'reason' => $request->reason,
            'assigned_at' => now(),
        ]);

        return response()->json([
            'task_id' => $id,
            'assigned_to' => $request->assigned_to_id,
            'assigned_by' => $request->assigned_by_id,
            'assigned_at' => now()->toISOString(),
            'reason' => $request->reason,
        ]);
    }

    /**
     * Add comment to task
     * 
     * POST /api/v1/tasks/{id}/comments
     */
    public function addComment(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        // Verify task exists and user has access
        $task = DB::table('tasks')
            ->where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('assigned_to_id', $user->id)
                  ->orWhere('created_by_id', $user->id);
            })
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        $commentId = DB::table('task_comments')->insertGetId([
            'task_id' => $id,
            'user_id' => $request->user_id,
            'content' => $request->content,
            'created_at' => now(),
        ]);

        $commentUser = DB::table('users')->where('id', $request->user_id)->first();

        return response()->json([
            'id' => $commentId,
            'task_id' => $id,
            'user_id' => $request->user_id,
            'user_name' => $commentUser->name ?? 'Unknown',
            'content' => $request->content,
            'created_at' => now()->toISOString(),
        ]);
    }
}




