<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Services\ExpenseLinkingService;
use App\Models\Battery;
use App\Models\Tyre;
use App\Models\SparePart;
use App\Models\ExpenseLink;

/**
 * Expense Controller
 * 
 * Manages expense records with full CRUD operations, audit trails,
 * reassignment, and vehicle KPIs.
 */
class ExpenseController extends Controller
{
    /**
     * List all expenses
     * GET /v1/expenses
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('expenses')
                ->select(
                    'expenses.*',
                    'users.name as employee_name',
                    'users.employee_id',
                    'projects.name as project_name',
                    'vehicles.registration_number as asset_registration',
                    'vehicles.make',
                    'vehicles.model'
                )
                ->leftJoin('users', 'expenses.user_id', '=', 'users.id')
                ->leftJoin('projects', 'expenses.project_id', '=', 'projects.id')
                ->leftJoin('vehicles', 'expenses.asset_id', '=', 'vehicles.id')
                ->orderBy('expenses.created_at', 'desc');

            // Filter by current user if mine=true
            if ($request->input('mine') === 'true' || $request->input('mine') === true) {
                $query->where('expenses.user_id', $request->user()->id);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('expenses.status', $request->input('status'));
            }

            // Filter by category
            if ($request->has('category')) {
                $query->where('expenses.category', $request->input('category'));
            }

            // Filter by date range
            if ($request->has('date_from')) {
                $query->whereDate('expenses.date', '>=', $request->input('date_from'));
            }
            if ($request->has('date_to')) {
                $query->whereDate('expenses.date', '<=', $request->input('date_to'));
            }

            // Pagination
            $perPage = $request->input('per_page', 50);
            $expenses = $query->paginate($perPage);

            $data = $expenses->items();
            $formatted = array_map(function ($expense) {
                $assetName = null;
                if ($expense->asset_registration) {
                    $assetName = trim(($expense->make ?? '') . ' ' . ($expense->model ?? '') . ' ' . ($expense->asset_registration ?? ''));
                }

                return [
                    'id' => (string) $expense->id,
                    'amount' => (float) $expense->amount,
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'payment_method' => $expense->payment_method,
                    'date' => $expense->date,
                    'status' => $expense->status ?? 'pending',
                    'employee_id' => $expense->employee_id,
                    'employee_name' => $expense->employee_name,
                    'project_id' => $expense->project_id,
                    'project_name' => $expense->project_name,
                    'asset_id' => $expense->asset_id,
                    'asset_name' => $assetName,
                    'asset_registration' => $expense->asset_registration,
                    'created_at' => $expense->created_at,
                    'updated_at' => $expense->updated_at,
                    'approved_by' => $expense->approved_by ?? null,
                    'approved_at' => $expense->approved_at ?? null,
                ];
            }, $data);

            return response()->json([
                'data' => $formatted,
                'total' => $expenses->total(),
                'per_page' => $expenses->perPage(),
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch expenses: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch expenses'], 500);
        }
    }

    /**
     * Get a single expense
     * GET /v1/expenses/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $expense = DB::table('expenses')
                ->select(
                    'expenses.*',
                    'users.name as employee_name',
                    'users.employee_id',
                    'projects.name as project_name',
                    'vehicles.registration_number as asset_registration',
                    'vehicles.make',
                    'vehicles.model'
                )
                ->leftJoin('users', 'expenses.user_id', '=', 'users.id')
                ->leftJoin('projects', 'expenses.project_id', '=', 'projects.id')
                ->leftJoin('vehicles', 'expenses.asset_id', '=', 'vehicles.id')
                ->where('expenses.id', $id)
                ->first();

            if (!$expense) {
                return response()->json(['error' => 'Expense not found'], 404);
            }

            $assetName = null;
            if ($expense->asset_registration) {
                $assetName = trim(($expense->make ?? '') . ' ' . ($expense->model ?? '') . ' ' . ($expense->asset_registration ?? ''));
            }

            // Fetch linked items (including components)
            $links = [];
            $linkedComponents = [];
            try {
                $linkingService = app(ExpenseLinkingService::class);
                $linkData = $linkingService->getExpenseLinks($id);
                
                foreach ($linkData as $link) {
                    if ($link->linked_type === 'component') {
                        // Load component details - need to determine component type from component itself
                        try {
                            // Try to find component in each table
                            $component = Battery::find($link->linked_id);
                            $componentType = 'battery';
                            
                            if (!$component) {
                                $component = Tyre::find($link->linked_id);
                                $componentType = 'tyre';
                            }
                            
                            if (!$component) {
                                $component = SparePart::find($link->linked_id);
                                $componentType = 'spare_part';
                            }
                            
                            if ($component) {
                                $componentName = '';
                                if ($componentType === 'spare_part') {
                                    $componentName = $component->name ?? 'Spare Part';
                                } else {
                                    $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                                    if (empty($componentName)) {
                                        $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                                    }
                                }
                                
                                $linkedComponents[] = [
                                    'component_type' => $componentType,
                                    'component_id' => $link->linked_id,
                                    'component_name' => $componentName,
                                    'link_reason' => $link->link_reason,
                                ];
                            }
                        } catch (\Exception $e) {
                            Log::warning('Failed to load component for expense: ' . $e->getMessage());
                        }
                    } else {
                        // Other link types
                        $links[] = [
                            'id' => $link->id,
                            'linked_type' => $link->linked_type,
                            'linked_id' => $link->linked_id,
                            'link_reason' => $link->link_reason,
                            'confidence_score' => $link->confidence_score,
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch expense links: ' . $e->getMessage(), ['expense_id' => $id]);
            }

            return response()->json([
                'id' => (string) $expense->id,
                'amount' => (float) $expense->amount,
                'category' => $expense->category,
                'description' => $expense->description,
                'payment_method' => $expense->payment_method,
                'date' => $expense->date,
                'status' => $expense->status ?? 'pending',
                'employee_id' => $expense->employee_id,
                'employee_name' => $expense->employee_name,
                'project_id' => $expense->project_id,
                'project_name' => $expense->project_name,
                'asset_id' => $expense->asset_id,
                'asset_name' => $assetName,
                'links' => $links,
                'linked_components' => $linkedComponents,
                'asset_registration' => $expense->asset_registration,
                'created_at' => $expense->created_at,
                'updated_at' => $expense->updated_at,
                'approved_by' => $expense->approved_by ?? null,
                'approved_at' => $expense->approved_at ?? null,
                'escalated_at' => $expense->escalated_at ?? null,
                'escalated_to' => $expense->escalated_to ?? null,
                'escalation_level' => $expense->escalation_level ?? 0,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch expense: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch expense'], 500);
        }
    }

    /**
     * Create a new expense
     * POST /v1/expenses
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'payment_method' => 'required|in:CASH,COMPANY_UPI,PERSONAL_UPI,CARD',
            'date' => 'required|date',
            'time' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'project_id' => 'nullable|uuid',
            'asset_id' => 'nullable|uuid',
            'template_id' => 'nullable|uuid',
            'notes' => 'nullable|string|max:1000',
            'receipts' => 'nullable|array',
            'receipts.*' => 'string',
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
            $expenseId = (string) Str::uuid();

            // Check if asset_id is required for fleet-related categories
            $fleetCategories = ['FUEL', 'PARTS_REPAIR', 'RTO_COMPLIANCE', 'DRIVER_PAYMENT', 'TOLLS_PARKING'];
            if (in_array($request->input('category'), $fleetCategories) && !$request->input('asset_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle linkage is required for fleet-related expenses',
                    'errors' => ['asset_id' => ['Vehicle linkage is required for this expense category']]
                ], 422);
            }

            DB::table('expenses')->insert([
                'id' => $expenseId,
                'user_id' => $user->id,
                'amount' => $request->input('amount'),
                'category' => $request->input('category'),
                'description' => $request->input('description'),
                'payment_method' => $request->input('payment_method'),
                'date' => $request->input('date'),
                'time' => $request->input('time'),
                'location' => $request->input('location'),
                'project_id' => $request->input('project_id'),
                'asset_id' => $request->input('asset_id'),
                'template_id' => $request->input('template_id'),
                'notes' => $request->input('notes'),
                'receipts' => $request->input('receipts') ? json_encode($request->input('receipts')) : null,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create audit log entry
            $this->createAuditLog($expenseId, 'created', null, null, $user->id, 'Expense created');

            // Auto-link expense to related items
            try {
                $linkingService = app(ExpenseLinkingService::class);
                $expenseData = [
                    'asset_id' => $request->input('asset_id'),
                    'project_id' => $request->input('project_id'),
                    'date' => $request->input('date'),
                    'description' => $request->input('description'),
                ];
                $linksCreated = $linkingService->linkExpenseToRelatedItems($expenseId, $expenseData);
                
                if ($linksCreated > 0) {
                    Log::info('Expense auto-linked to related items', [
                        'expense_id' => $expenseId,
                        'links_created' => $linksCreated
                    ]);
                }
            } catch (\Exception $e) {
                // Log error but don't fail expense creation
                Log::warning('Failed to auto-link expense: ' . $e->getMessage(), [
                    'expense_id' => $expenseId
                ]);
            }

            // Auto-create component records for component purchase expenses
            try {
                $this->createComponentFromExpense($expenseId, $request->all());
            } catch (\Exception $e) {
                // Log error but don't fail expense creation
                Log::warning('Failed to create component from expense: ' . $e->getMessage(), [
                    'expense_id' => $expenseId
                ]);
            }

            Log::info('Expense created', [
                'expense_id' => $expenseId,
                'user_id' => $user->id,
                'amount' => $request->input('amount'),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Expense created successfully',
                'expense' => [
                    'id' => $expenseId,
                    'amount' => $request->input('amount'),
                    'category' => $request->input('category'),
                    'status' => 'pending',
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create expense',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update an expense
     * PATCH /v1/expenses/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'payment_method' => 'sometimes|in:CASH,COMPANY_UPI,PERSONAL_UPI,CARD',
            'date' => 'sometimes|date',
            'project_id' => 'nullable|uuid',
            'asset_id' => 'nullable|uuid',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $expense = DB::table('expenses')->where('id', $id)->first();

            if (!$expense) {
                return response()->json(['error' => 'Expense not found'], 404);
            }

            DB::beginTransaction();

            $updateData = [];
            $auditChanges = [];

            if ($request->has('category')) {
                $oldValue = $expense->category;
                $newValue = $request->input('category');
                if ($oldValue !== $newValue) {
                    $updateData['category'] = $newValue;
                    $auditChanges[] = [
                        'field' => 'category',
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                        'action' => 'category_changed',
                    ];
                }
            }

            if ($request->has('amount')) {
                $updateData['amount'] = $request->input('amount');
            }
            if ($request->has('description')) {
                $updateData['description'] = $request->input('description');
            }
            if ($request->has('payment_method')) {
                $updateData['payment_method'] = $request->input('payment_method');
            }
            if ($request->has('date')) {
                $updateData['date'] = $request->input('date');
            }
            if ($request->has('project_id')) {
                $updateData['project_id'] = $request->input('project_id');
            }
            if ($request->has('asset_id')) {
                $updateData['asset_id'] = $request->input('asset_id');
            }

            $updateData['updated_at'] = now();

            DB::table('expenses')->where('id', $id)->update($updateData);

            // Create audit log entries
            $user = $request->user();
            foreach ($auditChanges as $change) {
                $this->createAuditLog(
                    $id,
                    $change['action'],
                    $change['field'],
                    $change['old_value'],
                    $change['new_value'],
                    $user->id,
                    "Changed {$change['field']} from {$change['old_value']} to {$change['new_value']}"
                );
            }

            if (!empty($updateData) && empty($auditChanges)) {
                $this->createAuditLog($id, 'updated', null, null, null, $user->id, 'Expense updated');
            }

            Log::info('Expense updated', [
                'expense_id' => $id,
                'updated_by' => $user->id,
                'changes' => array_keys($updateData),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Expense updated successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update expense',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Reassign an expense
     * PATCH /v1/expenses/{id}/reassign
     */
    public function reassign(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'field' => 'required|in:employee,project,asset',
            'value' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $expense = DB::table('expenses')->where('id', $id)->first();

            if (!$expense) {
                return response()->json(['error' => 'Expense not found'], 404);
            }

            DB::beginTransaction();

            $field = $request->input('field');
            $newValue = $request->input('value');
            $updateData = [];
            $oldValue = null;

            if ($field === 'employee') {
                $oldValue = $expense->user_id;
                $updateData['user_id'] = $newValue;
            } elseif ($field === 'project') {
                $oldValue = $expense->project_id;
                $updateData['project_id'] = $newValue ?: null;
            } elseif ($field === 'asset') {
                $oldValue = $expense->asset_id;
                $updateData['asset_id'] = $newValue ?: null;
            }

            $updateData['updated_at'] = now();

            DB::table('expenses')->where('id', $id)->update($updateData);

            // Create audit log
            $user = $request->user();
            $this->createAuditLog(
                $id,
                'reassigned',
                $field,
                $oldValue,
                $newValue,
                $user->id,
                "Reassigned {$field} from {$oldValue} to {$newValue}"
            );

            Log::info('Expense reassigned', [
                'expense_id' => $id,
                'field' => $field,
                'old_value' => $oldValue,
                'new_value' => $newValue,
                'reassigned_by' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Expense reassigned successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reassign expense: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reassign expense',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get audit trail for an expense
     * GET /v1/expenses/{id}/audit
     */
    public function getAudit(string $id): JsonResponse
    {
        try {
            // Check if expense exists
            $expense = DB::table('expenses')->where('id', $id)->first();
            if (!$expense) {
                return response()->json(['error' => 'Expense not found'], 404);
            }

            // Check if expense_audit_logs table exists
            if (!DB::getSchemaBuilder()->hasTable('expense_audit_logs')) {
                return response()->json(['data' => []]);
            }

            $logs = DB::table('expense_audit_logs')
                ->select(
                    'expense_audit_logs.*',
                    'users.name as changed_by_name'
                )
                ->leftJoin('users', 'expense_audit_logs.changed_by', '=', 'users.id')
                ->where('expense_audit_logs.expense_id', $id)
                ->orderBy('expense_audit_logs.changed_at', 'desc')
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => (string) $log->id,
                        'expense_id' => $log->expense_id,
                        'action' => $log->action,
                        'field' => $log->field,
                        'old_value' => $log->old_value,
                        'new_value' => $log->new_value,
                        'changed_by' => (string) $log->changed_by,
                        'changed_by_name' => $log->changed_by_name ?? 'System',
                        'changed_at' => $log->changed_at,
                        'notes' => $log->notes,
                    ];
                });

            return response()->json(['data' => $logs]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch audit logs: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch audit logs'], 500);
        }
    }

    /**
     * Get vehicle-centric KPIs
     * GET /v1/expenses/vehicle-kpis
     */
    public function getVehicleKPIs(Request $request): JsonResponse
    {
        try {
            // Get expenses grouped by vehicle
            $expenses = DB::table('expenses')
                ->select(
                    'vehicles.registration_number',
                    DB::raw('SUM(expenses.amount) as total_spend'),
                    DB::raw('COUNT(expenses.id) as expense_count'),
                    DB::raw('MAX(expenses.date) as last_expense_date')
                )
                ->join('vehicles', 'expenses.asset_id', '=', 'vehicles.id')
                ->where('expenses.status', 'approved')
                ->groupBy('vehicles.registration_number')
                ->get()
                ->map(function ($item) {
                    return [
                        'registration_number' => $item->registration_number,
                        'total_spend' => (float) $item->total_spend,
                        'expense_count' => (int) $item->expense_count,
                        'last_expense_date' => $item->last_expense_date,
                        // Budget and variance would come from a budgets table if it exists
                        'budget' => null,
                        'variance' => null,
                    ];
                });

            return response()->json(['data' => $expenses]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch vehicle KPIs: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch vehicle KPIs'], 500);
        }
    }

    /**
     * Create an audit log entry
     */
    private function createAuditLog(
        string $expenseId,
        string $action,
        ?string $field,
        $oldValue,
        $newValue,
        int $changedBy,
        ?string $notes = null
    ): void {
        // Check if expense_audit_logs table exists
        if (!DB::getSchemaBuilder()->hasTable('expense_audit_logs')) {
            return; // Silently skip if table doesn't exist
        }

        try {
            DB::table('expense_audit_logs')->insert([
                'id' => (string) Str::uuid(),
                'expense_id' => $expenseId,
                'action' => $action,
                'field' => $field,
                'old_value' => $oldValue ? (string) $oldValue : null,
                'new_value' => $newValue ? (string) $newValue : null,
                'changed_by' => $changedBy,
                'changed_at' => now(),
                'notes' => $notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log: ' . $e->getMessage());
            // Don't throw - audit logging is non-critical
        }
    }

    /**
     * Create component record from expense if it's a component purchase
     */
    protected function createComponentFromExpense(string $expenseId, array $expenseData): void
    {
        $category = $expenseData['category'] ?? '';
        $description = strtolower($expenseData['description'] ?? '');
        $amount = $expenseData['amount'] ?? 0;
        $vehicleId = $expenseData['asset_id'] ?? null;
        $date = $expenseData['date'] ?? now()->format('Y-m-d');
        
        // Only process PARTS_REPAIR category expenses
        if ($category !== 'PARTS_REPAIR') {
            return;
        }
        
        // Detect component type from description keywords
        $componentType = null;
        if (strpos($description, 'battery') !== false || strpos($description, 'batt') !== false) {
            $componentType = 'battery';
        } elseif (strpos($description, 'tyre') !== false || strpos($description, 'tire') !== false || strpos($description, 'wheel') !== false) {
            $componentType = 'tyre';
        } elseif (strpos($description, 'spare') !== false || strpos($description, 'part') !== false) {
            $componentType = 'spare_part';
        }
        
        if (!$componentType) {
            return; // Not a component purchase
        }
        
        // Extract component details from description
        $brand = null;
        $model = null;
        $serialNumber = null;
        $partNumber = null;
        $name = null;
        
        // Simple extraction - look for common patterns
        $descriptionParts = preg_split('/[\s,]+/', $description);
        foreach ($descriptionParts as $part) {
            $part = trim($part);
            if (strlen($part) > 2) {
                // Common battery brands
                if (in_array(strtolower($part), ['exide', 'amaron', 'luminous', 'livguard', 'okaya'])) {
                    $brand = ucfirst(strtolower($part));
                }
                // Common tyre brands
                if (in_array(strtolower($part), ['mrf', 'apollo', 'ceat', 'bridgestone', 'michelin', 'goodyear'])) {
                    $brand = strtoupper($part);
                }
            }
        }
        
        // Create component record
        $component = null;
        $componentId = null;
        
        try {
            switch ($componentType) {
                case 'battery':
                    $component = Battery::create([
                        'serial_number' => $serialNumber ?? 'EXP-' . substr($expenseId, 0, 8),
                        'brand' => $brand ?? 'Unknown',
                        'model' => $model ?? 'Standard',
                        'capacity' => null,
                        'voltage' => null,
                        'purchase_date' => $date,
                        'purchase_cost' => $amount,
                        'current_vehicle_id' => $vehicleId,
                        'status' => $vehicleId ? 'installed' : 'in_stock',
                        'notes' => "Auto-created from expense #{$expenseId}: {$expenseData['description']}",
                    ]);
                    $componentId = $component->id;
                    break;
                    
                case 'tyre':
                    $component = Tyre::create([
                        'serial_number' => $serialNumber ?? 'EXP-' . substr($expenseId, 0, 8),
                        'part_number' => $partNumber ?? null,
                        'brand' => $brand ?? 'Unknown',
                        'model' => $model ?? 'Standard',
                        'size' => null,
                        'purchase_date' => $date,
                        'purchase_cost' => $amount,
                        'current_vehicle_id' => $vehicleId,
                        'position' => null,
                        'status' => $vehicleId ? 'installed' : 'in_stock',
                        'notes' => "Auto-created from expense #{$expenseId}: {$expenseData['description']}",
                    ]);
                    $componentId = $component->id;
                    break;
                    
                case 'spare_part':
                    $component = SparePart::create([
                        'part_number' => $partNumber ?? 'EXP-' . substr($expenseId, 0, 8),
                        'name' => $name ?? ($expenseData['description'] ?? 'Spare Part'),
                        'category' => null,
                        'brand' => $brand ?? 'Unknown',
                        'model' => $model ?? null,
                        'purchase_date' => $date,
                        'purchase_cost' => $amount,
                        'current_vehicle_id' => $vehicleId,
                        'status' => $vehicleId ? 'installed' : 'in_stock',
                        'notes' => "Auto-created from expense #{$expenseId}: {$expenseData['description']}",
                    ]);
                    $componentId = $component->id;
                    break;
            }
            
            if ($component && $componentId) {
                // Link expense to component
                ExpenseLink::create([
                    'expense_id' => $expenseId,
                    'linked_type' => 'component',
                    'linked_id' => $componentId,
                    'link_reason' => 'auto_created_from_expense',
                    'confidence_score' => 0.9,
                ]);
                
                Log::info('Component created from expense', [
                    'expense_id' => $expenseId,
                    'component_type' => $componentType,
                    'component_id' => $componentId,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to create component from expense: ' . $e->getMessage(), [
                'expense_id' => $expenseId,
                'component_type' => $componentType,
            ]);
            throw $e;
        }
    }
}

