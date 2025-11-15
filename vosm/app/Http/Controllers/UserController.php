<?php

namespace App\Http\Controllers;

use App\Models\UserActivityLog;
use App\Models\PermissionChange;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * User Controller
 * 
 * Manages users with capability matrix (module-level + CRUD flags).
 * Supports both role-based (legacy) and capability-based access control.
 */
class UserController extends Controller
{
    /**
     * List all users
     * GET /v1/users
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('users')
                ->select('id', 'employee_id', 'name', 'email', 'role', 'capabilities', 'is_active', 'yard_id', 'created_at', 'updated_at', 'last_login_at');

            // Filter by role (for backward compatibility)
            if ($request->has('role')) {
                $query->where('role', $request->input('role'));
            }

            // Filter by status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->input('is_active'));
            }

            $users = $query->orderBy('name')->get()->map(function ($user) {
                $capabilities = $user->capabilities ? json_decode($user->capabilities, true) : null;
                return [
                    'id' => $user->id,
                    'employee_id' => $user->employee_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role, // Keep for backward compatibility
                    'capabilities' => $capabilities,
                    'is_active' => (bool) $user->is_active,
                    'yard_id' => $user->yard_id,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'last_login_at' => $user->last_login_at,
                ];
            });

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Failed to fetch users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    /**
     * Get a single user
     * GET /v1/users/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = DB::table('users')->where('id', $id)->first();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $capabilities = $user->capabilities ? json_decode($user->capabilities, true) : null;

            return response()->json([
                'id' => $user->id,
                'employee_id' => $user->employee_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'capabilities' => $capabilities,
                'is_active' => (bool) $user->is_active,
                'yard_id' => $user->yard_id,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'last_login_at' => $user->last_login_at,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch user'], 500);
        }
    }

    /**
     * Get user permissions
     * GET /v1/users/{id}/permissions
     */
    public function permissions(string $id): JsonResponse
    {
        try {
            $user = DB::table('users')->where('id', $id)->first();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $capabilities = $user->capabilities ? json_decode($user->capabilities, true) : null;

            // If no capabilities, derive from role (backward compatibility)
            if (!$capabilities) {
                $capabilities = $this->getCapabilitiesFromRole($user->role);
            }

            return response()->json([
                'user_id' => $user->id,
                'role' => $user->role,
                'capabilities' => $capabilities,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch user permissions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch permissions'], 500);
        }
    }

    /**
     * Create a new user
     * POST /v1/users
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|string|max:50|unique:users,employee_id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:super_admin,admin,supervisor,inspector,guard,clerk',
            'capabilities' => 'nullable|array',
            'capabilities.*' => 'array',
            'capabilities.*.*' => 'in:create,read,update,delete,approve,validate,review,reassign,export',
            'is_active' => 'boolean',
            'yard_id' => 'nullable|uuid',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $capabilities = $request->input('capabilities');
            
            // If no capabilities provided, derive from role
            if (!$capabilities && $request->has('role')) {
                $capabilities = $this->getCapabilitiesFromRole($request->input('role'));
            }

            $userId = DB::table('users')->insertGetId([
                'employee_id' => $request->input('employee_id'),
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
                'role' => $request->input('role', 'clerk'),
                'capabilities' => $capabilities ? json_encode($capabilities) : null,
                'is_active' => $request->input('is_active', true),
                'yard_id' => $request->input('yard_id'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $user = DB::table('users')->where('id', $userId)->first();

            Log::info('User created', [
                'user_id' => $userId,
                'employee_id' => $request->input('employee_id'),
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'employee_id' => $user->employee_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'capabilities' => $capabilities,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update a user
     * PUT /v1/users/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'role' => 'nullable|in:super_admin,admin,supervisor,inspector,guard,clerk',
            'capabilities' => 'nullable|array',
            'capabilities.*' => 'array',
            'capabilities.*.*' => 'in:create,read,update,delete,approve,validate,review,reassign,export',
            'is_active' => 'boolean',
            'yard_id' => 'nullable|uuid',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = DB::table('users')->where('id', $id)->first();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $updateData = [];
            
            if ($request->has('name')) {
                $updateData['name'] = $request->input('name');
            }
            if ($request->has('email')) {
                $updateData['email'] = $request->input('email');
            }
            if ($request->has('role')) {
                $updateData['role'] = $request->input('role');
            }
            if ($request->has('capabilities')) {
                $capabilities = $request->input('capabilities');
                $updateData['capabilities'] = $capabilities ? json_encode($capabilities) : null;
            } elseif ($request->has('role')) {
                // If role changed but capabilities not provided, update capabilities from role
                $updateData['capabilities'] = json_encode($this->getCapabilitiesFromRole($request->input('role')));
            }
            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->input('is_active');
            }
            if ($request->has('yard_id')) {
                $updateData['yard_id'] = $request->input('yard_id');
            }

            $updateData['updated_at'] = now();

            DB::table('users')->where('id', $id)->update($updateData);

            Log::info('User updated', [
                'user_id' => $id,
                'updated_by' => auth()->id(),
                'changes' => array_keys($updateData),
            ]);

            $updatedUser = DB::table('users')->where('id', $id)->first();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $updatedUser->id,
                    'employee_id' => $updatedUser->employee_id,
                    'name' => $updatedUser->name,
                    'email' => $updatedUser->email,
                    'role' => $updatedUser->role,
                    'capabilities' => $updatedUser->capabilities ? json_decode($updatedUser->capabilities, true) : null,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Delete a user
     * DELETE /v1/users/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $user = DB::table('users')->where('id', $id)->first();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            // Soft delete by deactivating
            DB::table('users')->where('id', $id)->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

            Log::info('User deactivated', [
                'user_id' => $id,
                'deactivated_by' => auth()->id(),
            ]);

            return response()->json(['message' => 'User deactivated successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete user'], 500);
        }
    }

    /**
     * Get capabilities from role (backward compatibility)
     */
    private function getCapabilitiesFromRole(?string $role): array
    {
        $roleCapabilities = [
            'super_admin' => [
                'gate_pass' => ['create', 'read', 'update', 'delete', 'approve', 'validate'],
                'inspection' => ['create', 'read', 'update', 'delete', 'approve', 'review'],
                'expense' => ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
                'user_management' => ['create', 'read', 'update', 'delete'],
                'reports' => ['read', 'export'],
            ],
            'admin' => [
                'gate_pass' => ['create', 'read', 'update', 'delete', 'approve', 'validate'],
                'inspection' => ['create', 'read', 'update', 'delete', 'approve', 'review'],
                'expense' => ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
                'user_management' => ['read', 'update'],
                'reports' => ['read', 'export'],
            ],
            'supervisor' => [
                'gate_pass' => ['read', 'approve', 'validate'],
                'inspection' => ['read', 'approve', 'review'],
                'expense' => ['read', 'approve'],
                'user_management' => [],
                'reports' => ['read'],
            ],
            'inspector' => [
                'gate_pass' => ['read'],
                'inspection' => ['create', 'read', 'update'],
                'expense' => ['create', 'read'],
                'user_management' => [],
                'reports' => [],
            ],
            'guard' => [
                'gate_pass' => ['read', 'validate'],
                'inspection' => ['read'],
                'expense' => ['read'],
                'user_management' => [],
                'reports' => [],
            ],
            'clerk' => [
                'gate_pass' => ['create', 'read'],
                'inspection' => ['read'],
                'expense' => ['create', 'read'],
                'user_management' => [],
                'reports' => [],
            ],
        ];

        return $roleCapabilities[$role] ?? [];
    }

    /**
     * Bulk assign capabilities to multiple users
     * POST /v1/users/bulk-assign-capabilities
     */
    public function bulkAssignCapabilities(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|uuid|exists:users,id',
            'capabilities' => 'required|array',
            'capabilities.*' => 'array',
            'capabilities.*.*' => 'in:create,read,update,delete,approve,validate,review,reassign,export',
            'merge_mode' => 'nullable|in:replace,merge',
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
            
            $userIds = $request->input('user_ids');
            $capabilities = $request->input('capabilities');
            $mergeMode = $request->input('merge_mode', 'replace');
            $updatedCount = 0;

            foreach ($userIds as $userId) {
                $user = DB::table('users')->where('id', $userId)->first();
                if (!$user) continue;

                $currentCapabilities = $user->capabilities ? json_decode($user->capabilities, true) : [];
                
                if ($mergeMode === 'merge') {
                    $mergedCapabilities = $currentCapabilities;
                    foreach ($capabilities as $module => $actions) {
                        if (!isset($mergedCapabilities[$module])) {
                            $mergedCapabilities[$module] = [];
                        }
                        $mergedCapabilities[$module] = array_unique(array_merge($mergedCapabilities[$module], $actions));
                    }
                    $newCapabilities = $mergedCapabilities;
                } else {
                    $newCapabilities = $capabilities;
                }

                DB::table('users')->where('id', $userId)->update([
                    'capabilities' => json_encode($newCapabilities),
                    'updated_at' => now(),
                ]);
                $updatedCount++;
            }

            DB::commit();

            Log::info('Bulk capabilities assigned', [
                'user_ids' => $userIds,
                'updated_count' => $updatedCount,
                'merge_mode' => $mergeMode,
                'changed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Capabilities assigned to {$updatedCount} user(s)",
                'updated_count' => $updatedCount,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk assign capabilities: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign capabilities',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Bulk activate users
     * POST /v1/users/bulk-activate
     */
    public function bulkActivate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userIds = $request->input('user_ids');
            
            DB::table('users')->whereIn('id', $userIds)->update([
                'is_active' => true,
                'updated_at' => now(),
            ]);

            Log::info('Users bulk activated', [
                'user_ids' => $userIds,
                'count' => count($userIds),
                'changed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => count($userIds) . ' user(s) activated',
                'updated_count' => count($userIds),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk activate users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate users',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Bulk deactivate users
     * POST /v1/users/bulk-deactivate
     */
    public function bulkDeactivate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userIds = $request->input('user_ids');
            $currentUserId = auth()->id();
            $userIds = array_filter($userIds, fn($id) => $id !== $currentUserId);
            
            if (empty($userIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot deactivate yourself'
                ], 400);
            }
            
            DB::table('users')->whereIn('id', $userIds)->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

            Log::info('Users bulk deactivated', [
                'user_ids' => $userIds,
                'count' => count($userIds),
                'changed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => count($userIds) . ' user(s) deactivated',
                'updated_count' => count($userIds),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk deactivate users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate users',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Bulk assign role to multiple users
     * POST /v1/users/bulk-assign-role
     */
    public function bulkAssignRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|uuid|exists:users,id',
            'role' => 'required|in:super_admin,admin,supervisor,inspector,guard,clerk',
            'update_capabilities' => 'nullable|boolean',
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
            
            $userIds = $request->input('user_ids');
            $role = $request->input('role');
            $updateCapabilities = $request->input('update_capabilities', true);
            
            $updateData = ['role' => $role, 'updated_at' => now()];
            
            if ($updateCapabilities) {
                $updateData['capabilities'] = json_encode($this->getCapabilitiesFromRole($role));
            }
            
            DB::table('users')->whereIn('id', $userIds)->update($updateData);

            DB::commit();

            Log::info('Users bulk role assigned', [
                'user_ids' => $userIds,
                'role' => $role,
                'count' => count($userIds),
                'update_capabilities' => $updateCapabilities,
                'changed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Role '{$role}' assigned to " . count($userIds) . ' user(s)',
                'updated_count' => count($userIds),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk assign role: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign role',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}

