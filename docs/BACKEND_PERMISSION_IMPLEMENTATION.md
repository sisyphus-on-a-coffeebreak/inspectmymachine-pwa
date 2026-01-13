# Backend Permission Enforcement Implementation Guide

This document provides Laravel backend implementation examples for enforcing permission checks on all API endpoints.

## Overview

All privileged operations must be protected by backend permission checks. This guide provides:
- Middleware for permission checking
- Controller examples with permission enforcement
- Error response format
- Testing examples

## Error Response Format

When a user lacks permission, return:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to [action] [resource]",
  "required_capability": "module.action"
}
```

HTTP Status: `403 Forbidden`

## Implementation Steps

### Step 1: Create Permission Middleware

Create `app/Http/Middleware/CheckPermission.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Authentication required',
            ], 401);
        }
        
        // Super admin bypass (unless granular enforcement is requested)
        if ($user->role === 'super_admin' && !$request->has('enforce_granular')) {
            return $next($request);
        }
        
        // Check if user has the required capability
        if (!$this->hasCapability($user, $module, $action)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "You do not have permission to {$action} {$module}",
                'required_capability' => "{$module}.{$action}",
            ], 403);
        }
        
        return $next($request);
    }
    
    /**
     * Check if user has capability
     */
    private function hasCapability($user, string $module, string $action): bool
    {
        // Check enhanced capabilities first
        if ($user->enhanced_capabilities) {
            $enhancedCaps = is_string($user->enhanced_capabilities) 
                ? json_decode($user->enhanced_capabilities, true)
                : $user->enhanced_capabilities;
            
            if (is_array($enhancedCaps)) {
                foreach ($enhancedCaps as $cap) {
                    if (isset($cap['module']) && $cap['module'] === $module &&
                        isset($cap['action']) && $cap['action'] === $action) {
                        // Check if capability is still valid (not expired, time restrictions, etc.)
                        if ($this->isCapabilityValid($cap)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        // Check basic capabilities
        $capabilities = is_string($user->capabilities) 
            ? json_decode($user->capabilities, true)
            : $user->capabilities;
        
        if (is_array($capabilities) && isset($capabilities[$module])) {
            return in_array($action, $capabilities[$module]);
        }
        
        // Fall back to role-based capabilities
        return $this->hasRoleCapability($user->role, $module, $action);
    }
    
    /**
     * Check if capability is valid (not expired, time restrictions, etc.)
     */
    private function isCapabilityValid(array $capability): bool
    {
        // Check expiration
        if (isset($capability['expires_at'])) {
            if (now()->greaterThan($capability['expires_at'])) {
                return false;
            }
        }
        
        // Check time restrictions
        if (isset($capability['time_restrictions'])) {
            // Implement time-based restriction logic
            // Example: check if current time is within allowed hours
        }
        
        return true;
    }
    
    /**
     * Check role-based capabilities (fallback)
     */
    private function hasRoleCapability(string $role, string $module, string $action): bool
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
        
        return isset($roleCapabilities[$role][$module]) &&
               in_array($action, $roleCapabilities[$role][$module]);
    }
}
```

### Step 2: Register Middleware

In `app/Http/Kernel.php` (Laravel 10) or `bootstrap/app.php` (Laravel 11):

```php
// Laravel 10
protected $routeMiddleware = [
    // ... other middleware
    'permission' => \App\Http\Middleware\CheckPermission::class,
];

// Laravel 11
$middleware->alias([
    'permission' => \App\Http\Middleware\CheckPermission::class,
]);
```

### Step 3: Apply Middleware to Routes

In `routes/api.php`:

```php
// User Management Routes
Route::middleware(['auth:sanctum', 'permission:user_management,read'])->group(function () {
    Route::get('/v1/users', [UserController::class, 'index']);
    Route::get('/v1/users/{id}', [UserController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'permission:user_management,create'])->group(function () {
    Route::post('/v1/users', [UserController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'permission:user_management,update'])->group(function () {
    Route::put('/v1/users/{id}', [UserController::class, 'update']);
    Route::post('/v1/users/{id}/reset-password', [UserController::class, 'resetPassword']);
});

Route::middleware(['auth:sanctum', 'permission:user_management,delete'])->group(function () {
    Route::delete('/v1/users/{id}', [UserController::class, 'destroy']);
});

// Bulk Operations
Route::middleware(['auth:sanctum', 'permission:user_management,update'])->group(function () {
    Route::post('/v1/users/bulk-activate', [UserController::class, 'bulkActivate']);
    Route::post('/v1/users/bulk-deactivate', [UserController::class, 'bulkDeactivate']);
    Route::post('/v1/users/bulk-assign-role', [UserController::class, 'bulkAssignRole']);
    Route::post('/v1/users/bulk-assign-capabilities', [UserController::class, 'bulkAssignCapabilities']);
});

// Gate Pass Routes
Route::middleware(['auth:sanctum', 'permission:gate_pass,read'])->group(function () {
    Route::get('/v2/gate-passes', [GatePassController::class, 'index']);
    Route::get('/v2/gate-passes/{id}', [GatePassController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'permission:gate_pass,create'])->group(function () {
    Route::post('/v2/gate-passes', [GatePassController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'permission:gate_pass,update'])->group(function () {
    Route::patch('/v2/gate-passes/{id}', [GatePassController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'permission:gate_pass,delete'])->group(function () {
    Route::delete('/v2/gate-passes/{id}', [GatePassController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:gate_pass,approve'])->group(function () {
    Route::post('/v2/gate-passes/{id}/approve', [GatePassController::class, 'approve']);
});

Route::middleware(['auth:sanctum', 'permission:gate_pass,validate'])->group(function () {
    Route::post('/v2/gate-passes/{id}/validate', [GatePassController::class, 'validate']);
    Route::post('/v2/gate-passes/{id}/entry', [GatePassController::class, 'recordEntry']);
    Route::post('/v2/gate-passes/{id}/exit', [GatePassController::class, 'recordExit']);
});

// Expense Routes
Route::middleware(['auth:sanctum', 'permission:expense,read'])->group(function () {
    Route::get('/v1/expenses', [ExpenseController::class, 'index']);
    Route::get('/v1/expenses/{id}', [ExpenseController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'permission:expense,create'])->group(function () {
    Route::post('/v1/expenses', [ExpenseController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'permission:expense,update'])->group(function () {
    Route::put('/v1/expenses/{id}', [ExpenseController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'permission:expense,delete'])->group(function () {
    Route::delete('/v1/expenses/{id}', [ExpenseController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:expense,approve'])->group(function () {
    Route::post('/v1/expenses/{id}/approve', [ExpenseController::class, 'approve']);
    Route::post('/v1/expenses/{id}/reject', [ExpenseController::class, 'reject']);
});

Route::middleware(['auth:sanctum', 'permission:expense,reassign'])->group(function () {
    Route::post('/v1/expenses/{id}/reassign', [ExpenseController::class, 'reassign']);
});

// Inspection Routes
Route::middleware(['auth:sanctum', 'permission:inspection,read'])->group(function () {
    Route::get('/v1/inspections', [InspectionController::class, 'index']);
    Route::get('/v1/inspections/{id}', [InspectionController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'permission:inspection,create'])->group(function () {
    Route::post('/v1/inspections', [InspectionController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'permission:inspection,update'])->group(function () {
    Route::put('/v1/inspections/{id}', [InspectionController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'permission:inspection,delete'])->group(function () {
    Route::delete('/v1/inspections/{id}', [InspectionController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:inspection,approve'])->group(function () {
    Route::post('/v1/inspections/{id}/approve', [InspectionController::class, 'approve']);
});

Route::middleware(['auth:sanctum', 'permission:inspection,review'])->group(function () {
    Route::post('/v1/inspections/{id}/review', [InspectionController::class, 'review']);
});
```

### Step 4: Update UserController with Pagination

Example `app/Http/Controllers/UserController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * List users with pagination
     * 
     * GET /v1/users?page=1&per_page=50&search=...&role=...&status=...
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);
        
        $query = User::query();
        
        // Search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }
        
        // Role filter
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }
        
        // Status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }
        
        // Paginate
        $users = $query->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
            'links' => [
                'next' => $users->nextPageUrl(),
                'prev' => $users->previousPageUrl(),
            ],
        ]);
    }
    
    /**
     * Create user
     * Requires: user_management.create
     */
    public function store(Request $request): JsonResponse
    {
        // Permission check is handled by middleware
        // Additional validation can be added here
        
        $validated = $request->validate([
            'employee_id' => 'required|string|unique:users,employee_id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:super_admin,admin,supervisor,inspector,guard,clerk',
            'capabilities' => 'nullable|array',
            'yard_id' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);
        
        $user = User::create($validated);
        
        return response()->json([
            'data' => $user,
        ], 201);
    }
    
    /**
     * Update user
     * Requires: user_management.update
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // Permission check is handled by middleware
        
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:super_admin,admin,supervisor,inspector,guard,clerk',
            'capabilities' => 'sometimes|array',
            'yard_id' => 'sometimes|nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'data' => $user->fresh(),
        ]);
    }
    
    /**
     * Delete user
     * Requires: user_management.delete
     */
    public function destroy(int $id): JsonResponse
    {
        // Permission check is handled by middleware
        
        $user = User::findOrFail($id);
        $user->delete();
        
        return response()->json(null, 204);
    }
    
    /**
     * Reset user password
     * Requires: user_management.update
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        // Permission check is handled by middleware
        
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);
        
        $user->update([
            'password' => bcrypt($validated['password']),
        ]);
        
        return response()->json([
            'message' => 'Password reset successfully',
        ]);
    }
    
    /**
     * Bulk activate users
     * Requires: user_management.update
     */
    public function bulkActivate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);
        
        $updated = User::whereIn('id', $validated['user_ids'])
            ->update(['is_active' => true]);
        
        return response()->json([
            'updated_count' => $updated,
        ]);
    }
    
    /**
     * Bulk deactivate users
     * Requires: user_management.update
     */
    public function bulkDeactivate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);
        
        $updated = User::whereIn('id', $validated['user_ids'])
            ->update(['is_active' => false]);
        
        return response()->json([
            'updated_count' => $updated,
        ]);
    }
    
    /**
     * Bulk assign role
     * Requires: user_management.update
     */
    public function bulkAssignRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
            'role' => 'required|in:super_admin,admin,supervisor,inspector,guard,clerk',
            'update_capabilities' => 'sometimes|boolean',
        ]);
        
        $updateData = ['role' => $validated['role']];
        
        // Update capabilities from role if requested
        if ($validated['update_capabilities'] ?? false) {
            // Set default capabilities for the role
            $updateData['capabilities'] = $this->getDefaultCapabilitiesForRole($validated['role']);
        }
        
        $updated = User::whereIn('id', $validated['user_ids'])
            ->update($updateData);
        
        return response()->json([
            'updated_count' => $updated,
        ]);
    }
    
    /**
     * Bulk assign capabilities
     * Requires: user_management.update
     */
    public function bulkAssignCapabilities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|integer|exists:users,id',
            'capabilities' => 'required|array',
            'merge_mode' => 'sometimes|in:replace,merge',
        ]);
        
        $mergeMode = $validated['merge_mode'] ?? 'replace';
        $updated = 0;
        
        foreach ($validated['user_ids'] as $userId) {
            $user = User::find($userId);
            if (!$user) continue;
            
            if ($mergeMode === 'merge') {
                $existing = $user->capabilities ?? [];
                $new = array_merge_recursive($existing, $validated['capabilities']);
                $user->capabilities = $new;
            } else {
                $user->capabilities = $validated['capabilities'];
            }
            
            $user->save();
            $updated++;
        }
        
        return response()->json([
            'updated_count' => $updated,
        ]);
    }
    
    /**
     * Get default capabilities for a role
     */
    private function getDefaultCapabilitiesForRole(string $role): array
    {
        // Return default capabilities based on role
        // This should match the frontend role capabilities
        return [];
    }
}
```

### Step 5: Testing Permission Enforcement

Create test file `tests/Feature/PermissionEnforcementTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionEnforcementTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_clerk_cannot_create_user()
    {
        $clerk = User::factory()->create(['role' => 'clerk']);
        
        $response = $this->actingAs($clerk)
            ->postJson('/api/v1/users', [
                'employee_id' => 'TEST001',
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);
        
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'Forbidden',
            'required_capability' => 'user_management.create',
        ]);
    }
    
    public function test_admin_can_create_user()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)
            ->postJson('/api/v1/users', [
                'employee_id' => 'TEST001',
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);
        
        $response->assertStatus(201);
    }
    
    public function test_guard_cannot_delete_gate_pass()
    {
        $guard = User::factory()->create(['role' => 'guard']);
        
        $response = $this->actingAs($guard)
            ->deleteJson('/api/v2/gate-passes/1');
        
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'Forbidden',
            'required_capability' => 'gate_pass.delete',
        ]);
    }
    
    public function test_clerk_cannot_approve_expense()
    {
        $clerk = User::factory()->create(['role' => 'clerk']);
        
        $response = $this->actingAs($clerk)
            ->postJson('/api/v1/expenses/1/approve');
        
        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'Forbidden',
            'required_capability' => 'expense.approve',
        ]);
    }
}
```

## Implementation Checklist

- [ ] Create `CheckPermission` middleware
- [ ] Register middleware in Kernel/bootstrap
- [ ] Apply middleware to all routes in `routes/api.php`
- [ ] Update UserController with pagination support
- [ ] Update GatePassController with permission checks
- [ ] Update ExpenseController with permission checks
- [ ] Update InspectionController with permission checks
- [ ] Write feature tests for permission enforcement
- [ ] Test all endpoints with different user roles
- [ ] Update API documentation

## Notes

1. **Super Admin Bypass**: Super admins bypass permission checks by default. To enforce granular permissions even for super admins, pass `enforce_granular=true` in the request.

2. **Enhanced Capabilities**: The middleware checks enhanced capabilities first, then falls back to basic capabilities, then role-based capabilities.

3. **Scope Restrictions**: Some endpoints may need additional scope checks beyond basic capability checks (e.g., users can only see their own records unless they have broader permissions). These should be implemented in the controller.

4. **Audit Logging**: Consider logging all permission-denied attempts for security monitoring.

5. **Performance**: Cache role capabilities to avoid repeated lookups.

## Related Documentation

- [Permission Audit Checklist](./PERMISSION_AUDIT.md)
- [Frontend Contract Tests](../src/test/contracts/permissions.test.ts)




