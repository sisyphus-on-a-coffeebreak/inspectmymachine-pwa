<?php

namespace App\Http\Controllers;

use App\Models\Battery;
use App\Models\Tyre;
use App\Models\SparePart;
use App\Models\ComponentCustodyHistory;
use App\Models\ComponentTransfer;
use App\Models\ComponentMaintenance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ComponentController extends Controller
{
    /**
     * List all components with filters
     * GET /api/v1/components
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $type = $request->input('type', 'all'); // 'battery', 'tyre', 'spare_part', 'all'
            $status = $request->input('status');
            $vehicleId = $request->input('vehicle_id');
            $search = $request->input('search');
            
            $components = collect();
            
            // Query batteries
            if ($type === 'all' || $type === 'battery') {
                $batteries = Battery::with('currentVehicle')
                    ->when($status, fn($q) => $q->where('status', $status))
                    ->when($vehicleId, fn($q) => $q->where('current_vehicle_id', $vehicleId))
                    ->when($search, function($q) use ($search) {
                        $q->where(function($query) use ($search) {
                            $query->where('serial_number', 'like', "%{$search}%")
                                  ->orWhere('brand', 'like', "%{$search}%")
                                  ->orWhere('model', 'like', "%{$search}%");
                        });
                    })
                    ->get()
                    ->map(function($battery) {
                        return [
                            'id' => $battery->id,
                            'type' => 'battery',
                            'serial_number' => $battery->serial_number,
                            'brand' => $battery->brand,
                            'model' => $battery->model,
                            'capacity' => $battery->capacity,
                            'voltage' => $battery->voltage,
                            'purchase_date' => $battery->purchase_date?->format('Y-m-d'),
                            'warranty_expires_at' => $battery->warranty_expires_at?->format('Y-m-d'),
                            'purchase_cost' => (float) $battery->purchase_cost,
                            'current_vehicle_id' => $battery->current_vehicle_id,
                            'current_vehicle' => $battery->currentVehicle ? [
                                'id' => $battery->currentVehicle->id,
                                'registration_number' => $battery->currentVehicle->registration_number,
                                'make' => $battery->currentVehicle->make,
                                'model' => $battery->currentVehicle->model,
                            ] : null,
                            'status' => $battery->status,
                            'notes' => $battery->notes,
                            'created_at' => $battery->created_at?->toISOString(),
                            'updated_at' => $battery->updated_at?->toISOString(),
                        ];
                    });
                $components = $components->merge($batteries);
            }
            
            // Query tyres
            if ($type === 'all' || $type === 'tyre') {
                $tyres = Tyre::with('currentVehicle')
                    ->when($status, fn($q) => $q->where('status', $status))
                    ->when($vehicleId, fn($q) => $q->where('current_vehicle_id', $vehicleId))
                    ->when($search, function($q) use ($search) {
                        $q->where(function($query) use ($search) {
                            $query->where('serial_number', 'like', "%{$search}%")
                                  ->orWhere('brand', 'like', "%{$search}%")
                                  ->orWhere('model', 'like', "%{$search}%")
                                  ->orWhere('size', 'like', "%{$search}%");
                        });
                    })
                    ->get()
                    ->map(function($tyre) {
                        return [
                            'id' => $tyre->id,
                            'type' => 'tyre',
                            'serial_number' => $tyre->serial_number,
                            'brand' => $tyre->brand,
                            'model' => $tyre->model,
                            'size' => $tyre->size,
                            'tread_depth_mm' => $tyre->tread_depth_mm,
                            'purchase_date' => $tyre->purchase_date?->format('Y-m-d'),
                            'warranty_expires_at' => $tyre->warranty_expires_at?->format('Y-m-d'),
                            'purchase_cost' => (float) $tyre->purchase_cost,
                            'current_vehicle_id' => $tyre->current_vehicle_id,
                            'position' => $tyre->position,
                            'current_vehicle' => $tyre->currentVehicle ? [
                                'id' => $tyre->currentVehicle->id,
                                'registration_number' => $tyre->currentVehicle->registration_number,
                                'make' => $tyre->currentVehicle->make,
                                'model' => $tyre->currentVehicle->model,
                            ] : null,
                            'status' => $tyre->status,
                            'notes' => $tyre->notes,
                            'created_at' => $tyre->created_at?->toISOString(),
                            'updated_at' => $tyre->updated_at?->toISOString(),
                        ];
                    });
                $components = $components->merge($tyres);
            }
            
            // Query spare parts
            if ($type === 'all' || $type === 'spare_part') {
                $spareParts = SparePart::with('currentVehicle')
                    ->when($status, fn($q) => $q->where('status', $status))
                    ->when($vehicleId, fn($q) => $q->where('current_vehicle_id', $vehicleId))
                    ->when($search, function($q) use ($search) {
                        $q->where(function($query) use ($search) {
                            $query->where('part_number', 'like', "%{$search}%")
                                  ->orWhere('name', 'like', "%{$search}%")
                                  ->orWhere('brand', 'like', "%{$search}%")
                                  ->orWhere('model', 'like', "%{$search}%");
                        });
                    })
                    ->get()
                    ->map(function($sparePart) {
                        return [
                            'id' => $sparePart->id,
                            'type' => 'spare_part',
                            'part_number' => $sparePart->part_number,
                            'name' => $sparePart->name,
                            'category' => $sparePart->category,
                            'brand' => $sparePart->brand,
                            'model' => $sparePart->model,
                            'purchase_date' => $sparePart->purchase_date?->format('Y-m-d'),
                            'warranty_expires_at' => $sparePart->warranty_expires_at?->format('Y-m-d'),
                            'purchase_cost' => (float) $sparePart->purchase_cost,
                            'current_vehicle_id' => $sparePart->current_vehicle_id,
                            'current_vehicle' => $sparePart->currentVehicle ? [
                                'id' => $sparePart->currentVehicle->id,
                                'registration_number' => $sparePart->currentVehicle->registration_number,
                                'make' => $sparePart->currentVehicle->make,
                                'model' => $sparePart->currentVehicle->model,
                            ] : null,
                            'status' => $sparePart->status,
                            'notes' => $sparePart->notes,
                            'created_at' => $sparePart->created_at?->toISOString(),
                            'updated_at' => $sparePart->updated_at?->toISOString(),
                        ];
                    });
                $components = $components->merge($spareParts);
            }
            
            // Sort by created_at desc
            $components = $components->sortByDesc('created_at')->values();
            
            // Pagination
            $perPage = $request->input('per_page', 20);
            $page = $request->input('page', 1);
            $total = $components->count();
            $offset = ($page - 1) * $perPage;
            $paginated = $components->slice($offset, $perPage)->values();
            
            return response()->json([
                'success' => true,
                'data' => $paginated,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get component details
     * GET /api/v1/components/{type}/{id}
     */
    public function show(string $type, string $id): JsonResponse
    {
        try {
            $component = null;
            $custodyHistory = [];
            
            switch ($type) {
                case 'battery':
                    $component = Battery::with('currentVehicle')->findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::with('currentVehicle')->findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::with('currentVehicle')->findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            // Get custody history
            $custodyHistory = ComponentCustodyHistory::with(['fromVehicle', 'toVehicle', 'transferredBy', 'approvedBy'])
                ->where('component_type', $type)
                ->where('component_id', $id)
                ->orderBy('transferred_at', 'desc')
                ->get()
                ->map(function($history) {
                    return [
                        'id' => $history->id,
                        'from_vehicle' => $history->fromVehicle ? [
                            'id' => $history->fromVehicle->id,
                            'registration_number' => $history->fromVehicle->registration_number,
                        ] : null,
                        'to_vehicle' => $history->toVehicle ? [
                            'id' => $history->toVehicle->id,
                            'registration_number' => $history->toVehicle->registration_number,
                        ] : null,
                        'transferred_by' => $history->transferredBy ? [
                            'id' => $history->transferredBy->id,
                            'name' => $history->transferredBy->name,
                        ] : null,
                        'approved_by' => $history->approvedBy ? [
                            'id' => $history->approvedBy->id,
                            'name' => $history->approvedBy->name,
                        ] : null,
                        'transfer_type' => $history->transfer_type,
                        'reason' => $history->reason,
                        'transferred_at' => $history->transferred_at?->toISOString(),
                        'created_at' => $history->created_at?->toISOString(),
                    ];
                });
            
            // Get maintenance records
            $maintenance = ComponentMaintenance::with('performedBy')
                ->where('component_type', $type)
                ->where('component_id', $id)
                ->orderBy('performed_at', 'desc')
                ->get()
                ->map(function($record) {
                    return [
                        'id' => $record->id,
                        'maintenance_type' => $record->maintenance_type,
                        'title' => $record->title,
                        'description' => $record->description,
                        'performed_at' => $record->performed_at?->format('Y-m-d'),
                        'next_due_date' => $record->next_due_date?->format('Y-m-d'),
                        'cost' => $record->cost ? (float) $record->cost : null,
                        'performed_by' => $record->performedBy ? [
                            'id' => $record->performedBy->id,
                            'name' => $record->performedBy->name,
                        ] : null,
                        'vendor_name' => $record->vendor_name,
                        'notes' => $record->notes,
                        'attachments' => $record->attachments,
                        'created_at' => $record->created_at?->toISOString(),
                    ];
                });
            
            $componentData = $component->toArray();
            $componentData['current_vehicle'] = $component->currentVehicle ? [
                'id' => $component->currentVehicle->id,
                'registration_number' => $component->currentVehicle->registration_number,
                'make' => $component->currentVehicle->make,
                'model' => $component->currentVehicle->model,
            ] : null;
            // Get related inspections
            $relatedInspections = DB::table('inspection_answers')
                ->where('component_type', $type)
                ->where('component_id', $id)
                ->join('inspections', 'inspection_answers.inspection_id', '=', 'inspections.id')
                ->join('vehicles', 'inspections.vehicle_id', '=', 'vehicles.id')
                ->select([
                    'inspections.id',
                    'inspections.status',
                    'inspections.completed_at',
                    'inspections.overall_rating',
                    'vehicles.registration_number',
                    'inspection_answers.answer_value',
                    'inspection_answers.question_id',
                ])
                ->orderBy('inspections.completed_at', 'desc')
                ->get()
                ->groupBy('id')
                ->map(function($inspectionAnswers) {
                    $first = $inspectionAnswers->first();
                    return [
                        'id' => $first->id,
                        'status' => $first->status,
                        'completed_at' => $first->completed_at,
                        'overall_rating' => $first->overall_rating,
                        'vehicle_registration' => $first->registration_number,
                        'measurements' => $inspectionAnswers->map(function($answer) {
                            return [
                                'question_id' => $answer->question_id,
                                'answer_value' => $answer->answer_value,
                            ];
                        })->values(),
                    ];
                })
                ->values();
            
            $componentData['custody_history'] = $custodyHistory;
            $componentData['maintenance'] = $maintenance;
            $componentData['related_inspections'] = $relatedInspections;
            
            return response()->json([
                'success' => true,
                'data' => $componentData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new component
     * POST /api/v1/components
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => ['required', Rule::in(['battery', 'tyre', 'spare_part'])],
            // Battery fields
            'serial_number' => 'required_if:type,battery,tyre|string|max:100',
            'part_number' => 'required_if:type,spare_part|string|max:100',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'purchase_date' => 'required|date',
            'warranty_expires_at' => 'nullable|date',
            'purchase_cost' => 'required|numeric|min:0',
            'current_vehicle_id' => 'nullable|exists:vehicles,id',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            // Battery-specific
            'capacity' => 'required_if:type,battery|string|max:50',
            'voltage' => 'required_if:type,battery|string|max:50',
            // Tyre-specific
            'size' => 'required_if:type,tyre|string|max:50',
            'tread_depth_mm' => 'nullable|integer|min:0',
            'position' => 'nullable|string|max:50',
            // Spare part-specific
            'name' => 'required_if:type,spare_part|string|max:200',
            'category' => 'required_if:type,spare_part|string|max:100',
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
            
            $type = $request->input('type');
            $component = null;
            
            switch ($type) {
                case 'battery':
                    $component = Battery::create([
                        'serial_number' => $request->input('serial_number'),
                        'brand' => $request->input('brand'),
                        'model' => $request->input('model'),
                        'capacity' => $request->input('capacity'),
                        'voltage' => $request->input('voltage'),
                        'purchase_date' => $request->input('purchase_date'),
                        'warranty_expires_at' => $request->input('warranty_expires_at'),
                        'purchase_cost' => $request->input('purchase_cost'),
                        'current_vehicle_id' => $request->input('current_vehicle_id'),
                        'status' => $request->input('status', 'active'),
                        'notes' => $request->input('notes'),
                    ]);
                    break;
                    
                case 'tyre':
                    $component = Tyre::create([
                        'serial_number' => $request->input('serial_number'),
                        'brand' => $request->input('brand'),
                        'model' => $request->input('model'),
                        'size' => $request->input('size'),
                        'tread_depth_mm' => $request->input('tread_depth_mm'),
                        'purchase_date' => $request->input('purchase_date'),
                        'warranty_expires_at' => $request->input('warranty_expires_at'),
                        'purchase_cost' => $request->input('purchase_cost'),
                        'current_vehicle_id' => $request->input('current_vehicle_id'),
                        'position' => $request->input('position'),
                        'status' => $request->input('status', 'active'),
                        'notes' => $request->input('notes'),
                    ]);
                    break;
                    
                case 'spare_part':
                    $component = SparePart::create([
                        'part_number' => $request->input('part_number'),
                        'name' => $request->input('name'),
                        'category' => $request->input('category'),
                        'brand' => $request->input('brand'),
                        'model' => $request->input('model'),
                        'purchase_date' => $request->input('purchase_date'),
                        'warranty_expires_at' => $request->input('warranty_expires_at'),
                        'purchase_cost' => $request->input('purchase_cost'),
                        'current_vehicle_id' => $request->input('current_vehicle_id'),
                        'status' => $request->input('status', 'in_stock'),
                        'notes' => $request->input('notes'),
                    ]);
                    break;
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' created successfully',
                'data' => $component->load('currentVehicle')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update component
     * PATCH /api/v1/components/{type}/{id}
     */
    public function update(Request $request, string $type, string $id): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            $component = null;
            
            switch ($type) {
                case 'battery':
                    $component = Battery::findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            // Track vehicle changes for custody history
            $oldVehicleId = $component->current_vehicle_id;
            $newVehicleId = $request->input('current_vehicle_id');
            
            $component->update($request->only($component->getFillable()));
            
            // Create custody history if vehicle assignment changed
            if ($oldVehicleId != $newVehicleId && $request->user()) {
                $transferType = 'install';
                $fromVehicleId = null;
                $toVehicleId = null;
                
                if ($oldVehicleId && $newVehicleId) {
                    // Transfer between vehicles
                    $transferType = 'transfer';
                    $fromVehicleId = $oldVehicleId;
                    $toVehicleId = $newVehicleId;
                } elseif ($oldVehicleId && !$newVehicleId) {
                    // Removed from vehicle
                    $transferType = 'remove';
                    $fromVehicleId = $oldVehicleId;
                } elseif (!$oldVehicleId && $newVehicleId) {
                    // Installed on vehicle
                    $transferType = 'install';
                    $toVehicleId = $newVehicleId;
                }
                
                ComponentCustodyHistory::create([
                    'component_type' => $type,
                    'component_id' => $component->id,
                    'from_vehicle_id' => $fromVehicleId,
                    'to_vehicle_id' => $toVehicleId,
                    'transferred_by' => $request->user()->id,
                    'transfer_type' => $transferType,
                    'reason' => $request->input('transfer_reason'),
                    'transferred_at' => now(),
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' updated successfully',
                'data' => $component->load('currentVehicle')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete component
     * DELETE /api/v1/components/{type}/{id}
     */
    public function destroy(string $type, string $id): JsonResponse
    {
        try {
            $component = null;
            
            switch ($type) {
                case 'battery':
                    $component = Battery::findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            $component->delete();
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transfer component between vehicles
     * POST /api/v1/components/{type}/{id}/transfer
     * 
     * For high-value components (> ₹10,000), creates a pending transfer request.
     * For low-value components, transfers immediately.
     */
    public function transfer(Request $request, string $type, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to_vehicle_id' => 'required|exists:vehicles,id',
            'reason' => 'nullable|string|max:500',
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
            
            $component = null;
            
            switch ($type) {
                case 'battery':
                    $component = Battery::findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            $fromVehicleId = $component->current_vehicle_id;
            $toVehicleId = $request->input('to_vehicle_id');
            
            if ($fromVehicleId === $toVehicleId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Component is already assigned to this vehicle'
                ], 400);
            }
            
            // Check if approval is required (components > ₹10,000)
            $approvalThreshold = 10000;
            $requiresApproval = $component->purchase_cost > $approvalThreshold;
            
            if ($requiresApproval) {
                // Create pending transfer request
                $transferRequest = ComponentTransfer::create([
                    'component_type' => $type,
                    'component_id' => $component->id,
                    'from_vehicle_id' => $fromVehicleId,
                    'to_vehicle_id' => $toVehicleId,
                    'requested_by' => $request->user()->id,
                    'status' => 'pending',
                    'reason' => $request->input('reason'),
                    'requested_at' => now(),
                ]);
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Transfer request created. Approval required for high-value components.',
                    'data' => [
                        'transfer_request' => $transferRequest->load(['fromVehicle', 'toVehicle', 'requestedBy']),
                        'requires_approval' => true,
                    ]
                ]);
            } else {
                // Transfer immediately for low-value components
                $component->update([
                    'current_vehicle_id' => $toVehicleId,
                ]);
                
                // Create custody history
                ComponentCustodyHistory::create([
                    'component_type' => $type,
                    'component_id' => $component->id,
                    'from_vehicle_id' => $fromVehicleId,
                    'to_vehicle_id' => $toVehicleId,
                    'transferred_by' => $request->user()->id,
                    'transfer_type' => $fromVehicleId ? 'transfer' : 'install',
                    'reason' => $request->input('reason'),
                    'transferred_at' => now(),
                ]);
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => ucfirst($type) . ' transferred successfully',
                    'data' => [
                        'component' => $component->load('currentVehicle'),
                        'requires_approval' => false,
                    ]
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to transfer component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to transfer component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove component from vehicle
     * POST /api/v1/components/{type}/{id}/remove
     */
    public function remove(Request $request, string $type, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
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
            
            $component = null;
            
            switch ($type) {
                case 'battery':
                    $component = Battery::findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            if (!$component->current_vehicle_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Component is not currently assigned to any vehicle'
                ], 400);
            }
            
            $fromVehicleId = $component->current_vehicle_id;
            
            // Update component
            $component->update([
                'current_vehicle_id' => null,
            ]);
            
            // Create custody history
            ComponentCustodyHistory::create([
                'component_type' => $type,
                'component_id' => $component->id,
                'from_vehicle_id' => $fromVehicleId,
                'to_vehicle_id' => null,
                'transferred_by' => $request->user()->id,
                'transfer_type' => 'remove',
                'reason' => $request->input('reason'),
                'transferred_at' => now(),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' removed from vehicle successfully',
                'data' => $component->load('currentVehicle')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to remove component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Install component on vehicle
     * POST /api/v1/components/{type}/{id}/install
     */
    public function install(Request $request, string $type, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to_vehicle_id' => 'required|exists:vehicles,id',
            'reason' => 'nullable|string|max:500',
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
            
            $component = null;
            
            switch ($type) {
                case 'battery':
                    $component = Battery::findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            $toVehicleId = $request->input('to_vehicle_id');
            
            if ($component->current_vehicle_id === $toVehicleId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Component is already assigned to this vehicle'
                ], 400);
            }
            
            $fromVehicleId = $component->current_vehicle_id;
            
            // Update component
            $component->update([
                'current_vehicle_id' => $toVehicleId,
            ]);
            
            // Create custody history
            ComponentCustodyHistory::create([
                'component_type' => $type,
                'component_id' => $component->id,
                'from_vehicle_id' => $fromVehicleId,
                'to_vehicle_id' => $toVehicleId,
                'transferred_by' => $request->user()->id,
                'transfer_type' => $fromVehicleId ? 'transfer' : 'install',
                'reason' => $request->input('reason'),
                'transferred_at' => now(),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' installed successfully',
                'data' => $component->load('currentVehicle')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to install component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to install component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve component transfer
     * POST /api/v1/components/transfers/{transferId}/approve
     */
    public function approveTransfer(Request $request, string $transferId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:500',
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
            
            $transfer = ComponentTransfer::with(['fromVehicle', 'toVehicle'])->findOrFail($transferId);
            
            if ($transfer->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer request is not pending'
                ], 400);
            }
            
            // Get component
            $component = null;
            switch ($transfer->component_type) {
                case 'battery':
                    $component = Battery::findOrFail($transfer->component_id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($transfer->component_id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($transfer->component_id);
                    break;
            }
            
            // Update component
            $component->update([
                'current_vehicle_id' => $transfer->to_vehicle_id,
            ]);
            
            // Update transfer request
            $transfer->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);
            
            // Create custody history
            ComponentCustodyHistory::create([
                'component_type' => $transfer->component_type,
                'component_id' => $transfer->component_id,
                'from_vehicle_id' => $transfer->from_vehicle_id,
                'to_vehicle_id' => $transfer->to_vehicle_id,
                'transferred_by' => $transfer->requested_by,
                'approved_by' => $request->user()->id,
                'transfer_type' => $transfer->from_vehicle_id ? 'transfer' : 'install',
                'reason' => $transfer->reason,
                'transferred_at' => now(),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Transfer approved successfully',
                'data' => $transfer->load(['fromVehicle', 'toVehicle', 'requestedBy', 'approvedBy', 'component'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve transfer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve transfer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject component transfer
     * POST /api/v1/components/transfers/{transferId}/reject
     */
    public function rejectTransfer(Request $request, string $transferId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $transfer = ComponentTransfer::findOrFail($transferId);
            
            if ($transfer->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer request is not pending'
                ], 400);
            }
            
            $transfer->update([
                'status' => 'rejected',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'rejection_reason' => $request->input('rejection_reason'),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Transfer rejected successfully',
                'data' => $transfer->load(['fromVehicle', 'toVehicle', 'requestedBy', 'approvedBy'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to reject transfer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject transfer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List pending transfer requests
     * GET /api/v1/components/transfers/pending
     */
    public function pendingTransfers(Request $request): JsonResponse
    {
        try {
            $transfers = ComponentTransfer::with(['fromVehicle', 'toVehicle', 'requestedBy', 'component'])
                ->where('status', 'pending')
                ->orderBy('requested_at', 'desc')
                ->get()
                ->map(function($transfer) {
                    $component = $transfer->component();
                    return [
                        'id' => $transfer->id,
                        'component_type' => $transfer->component_type,
                        'component_id' => $transfer->component_id,
                        'component' => $component ? [
                            'id' => $component->id,
                            'brand' => $component->brand,
                            'model' => $component->model,
                            'name' => $component->name ?? null,
                            'serial_number' => $component->serial_number ?? null,
                            'part_number' => $component->part_number ?? null,
                            'purchase_cost' => $component->purchase_cost,
                        ] : null,
                        'from_vehicle' => $transfer->fromVehicle ? [
                            'id' => $transfer->fromVehicle->id,
                            'registration_number' => $transfer->fromVehicle->registration_number,
                        ] : null,
                        'to_vehicle' => $transfer->toVehicle ? [
                            'id' => $transfer->toVehicle->id,
                            'registration_number' => $transfer->toVehicle->registration_number,
                        ] : null,
                        'requested_by' => $transfer->requestedBy ? [
                            'id' => $transfer->requestedBy->id,
                            'name' => $transfer->requestedBy->name,
                        ] : null,
                        'reason' => $transfer->reason,
                        'requested_at' => $transfer->requested_at?->toISOString(),
                        'created_at' => $transfer->created_at?->toISOString(),
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $transfers
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch pending transfers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending transfers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get component maintenance records
     * GET /api/v1/components/{type}/{id}/maintenance
     */
    public function getMaintenance(string $type, string $id): JsonResponse
    {
        try {
            $maintenance = ComponentMaintenance::with('performedBy')
                ->where('component_type', $type)
                ->where('component_id', $id)
                ->orderBy('performed_at', 'desc')
                ->get()
                ->map(function($record) {
                    return [
                        'id' => $record->id,
                        'maintenance_type' => $record->maintenance_type,
                        'title' => $record->title,
                        'description' => $record->description,
                        'performed_at' => $record->performed_at?->format('Y-m-d'),
                        'next_due_date' => $record->next_due_date?->format('Y-m-d'),
                        'cost' => $record->cost ? (float) $record->cost : null,
                        'performed_by' => $record->performedBy ? [
                            'id' => $record->performedBy->id,
                            'name' => $record->performedBy->name,
                        ] : null,
                        'vendor_name' => $record->vendor_name,
                        'notes' => $record->notes,
                        'attachments' => $record->attachments,
                        'created_at' => $record->created_at?->toISOString(),
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $maintenance
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch maintenance records: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch maintenance records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create maintenance record
     * POST /api/v1/components/{type}/{id}/maintenance
     */
    public function createMaintenance(Request $request, string $type, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'maintenance_type' => ['required', Rule::in(['service', 'repair', 'replacement', 'inspection', 'cleaning'])],
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:1000',
            'performed_at' => 'required|date',
            'next_due_date' => 'nullable|date|after:performed_at',
            'cost' => 'nullable|numeric|min:0',
            'vendor_name' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:1000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // Verify component exists
            $component = null;
            switch ($type) {
                case 'battery':
                    $component = Battery::findOrFail($id);
                    break;
                case 'tyre':
                    $component = Tyre::findOrFail($id);
                    break;
                case 'spare_part':
                    $component = SparePart::findOrFail($id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid component type'
                    ], 400);
            }
            
            $maintenance = ComponentMaintenance::create([
                'component_type' => $type,
                'component_id' => $id,
                'maintenance_type' => $request->input('maintenance_type'),
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'performed_at' => $request->input('performed_at'),
                'next_due_date' => $request->input('next_due_date'),
                'cost' => $request->input('cost'),
                'performed_by' => $request->user()->id,
                'vendor_name' => $request->input('vendor_name'),
                'notes' => $request->input('notes'),
                'attachments' => $request->input('attachments'),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Maintenance record created successfully',
                'data' => $maintenance->load('performedBy')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create maintenance record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create maintenance record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update maintenance record
     * PATCH /api/v1/components/maintenance/{maintenanceId}
     */
    public function updateMaintenance(Request $request, string $maintenanceId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'maintenance_type' => ['sometimes', Rule::in(['service', 'repair', 'replacement', 'inspection', 'cleaning'])],
            'title' => 'sometimes|required|string|max:200',
            'description' => 'nullable|string|max:1000',
            'performed_at' => 'sometimes|required|date',
            'next_due_date' => 'nullable|date',
            'cost' => 'nullable|numeric|min:0',
            'vendor_name' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:1000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $maintenance = ComponentMaintenance::findOrFail($maintenanceId);
            $maintenance->update($request->only([
                'maintenance_type',
                'title',
                'description',
                'performed_at',
                'next_due_date',
                'cost',
                'vendor_name',
                'notes',
                'attachments',
            ]));
            
            return response()->json([
                'success' => true,
                'message' => 'Maintenance record updated successfully',
                'data' => $maintenance->load('performedBy')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update maintenance record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update maintenance record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete maintenance record
     * DELETE /api/v1/components/maintenance/{maintenanceId}
     */
    public function deleteMaintenance(string $maintenanceId): JsonResponse
    {
        try {
            $maintenance = ComponentMaintenance::findOrFail($maintenanceId);
            $maintenance->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Maintenance record deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete maintenance record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete maintenance record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cost analysis data for components
     * GET /api/v1/components/cost-analysis
     */
    public function costAnalysis(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $componentType = $request->input('component_type'); // 'battery', 'tyre', 'spare_part', or null for all
            $vehicleId = $request->input('vehicle_id');
            
            $query = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0);
            
            if ($dateFrom) {
                $query->whereDate('performed_at', '>=', $dateFrom);
            }
            
            if ($dateTo) {
                $query->whereDate('performed_at', '<=', $dateTo);
            }
            
            if ($componentType) {
                $query->where('component_type', $componentType);
            }
            
            // Get total cost
            $totalCost = (float) $query->sum('cost');
            
            // Get cost by component type
            $costByType = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0)
                ->when($dateFrom, fn($q) => $q->whereDate('performed_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('performed_at', '<=', $dateTo))
                ->when($componentType, fn($q) => $q->where('component_type', $componentType))
                ->select('component_type', DB::raw('SUM(cost) as total_cost'), DB::raw('COUNT(*) as maintenance_count'))
                ->groupBy('component_type')
                ->get()
                ->map(function($item) {
                    return [
                        'component_type' => $item->component_type,
                        'total_cost' => (float) $item->total_cost,
                        'maintenance_count' => (int) $item->maintenance_count,
                    ];
                });
            
            // Get cost per component (top 20)
            $costPerComponent = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0)
                ->when($dateFrom, fn($q) => $q->whereDate('performed_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('performed_at', '<=', $dateTo))
                ->when($componentType, fn($q) => $q->where('component_type', $componentType))
                ->select('component_type', 'component_id', DB::raw('SUM(cost) as total_cost'), DB::raw('COUNT(*) as maintenance_count'))
                ->groupBy('component_type', 'component_id')
                ->orderBy('total_cost', 'desc')
                ->limit(20)
                ->get()
                ->map(function($item) {
                    $component = null;
                    $componentName = 'Unknown Component';
                    
                    try {
                        $component = match($item->component_type) {
                            'battery' => Battery::find($item->component_id),
                            'tyre' => Tyre::find($item->component_id),
                            'spare_part' => SparePart::find($item->component_id),
                            default => null
                        };
                        
                        if ($component) {
                            if ($item->component_type === 'spare_part') {
                                $componentName = $component->name ?? 'Spare Part';
                            } else {
                                $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                                if (empty($componentName)) {
                                    $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load component for cost analysis: ' . $e->getMessage());
                    }
                    
                    return [
                        'component_type' => $item->component_type,
                        'component_id' => $item->component_id,
                        'component_name' => $componentName,
                        'total_cost' => (float) $item->total_cost,
                        'maintenance_count' => (int) $item->maintenance_count,
                    ];
                });
            
            // Get cost per vehicle - query each component type separately and combine
            $vehicleCosts = collect();
            
            // Batteries
            $batteryCosts = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0)
                ->where('component_type', 'battery')
                ->when($dateFrom, fn($q) => $q->whereDate('performed_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('performed_at', '<=', $dateTo))
                ->join('batteries', 'component_maintenance.component_id', '=', 'batteries.id')
                ->whereNotNull('batteries.current_vehicle_id')
                ->when($vehicleId, fn($q) => $q->where('batteries.current_vehicle_id', $vehicleId))
                ->select(
                    'batteries.current_vehicle_id as vehicle_id',
                    DB::raw('SUM(component_maintenance.cost) as total_cost'),
                    DB::raw('COUNT(*) as maintenance_count')
                )
                ->groupBy('batteries.current_vehicle_id')
                ->get();
            
            // Tyres
            $tyreCosts = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0)
                ->where('component_type', 'tyre')
                ->when($dateFrom, fn($q) => $q->whereDate('performed_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('performed_at', '<=', $dateTo))
                ->when($componentType !== 'battery', fn($q) => $q) // Only if not filtering by battery
                ->join('tyres', 'component_maintenance.component_id', '=', 'tyres.id')
                ->whereNotNull('tyres.current_vehicle_id')
                ->when($vehicleId, fn($q) => $q->where('tyres.current_vehicle_id', $vehicleId))
                ->select(
                    'tyres.current_vehicle_id as vehicle_id',
                    DB::raw('SUM(component_maintenance.cost) as total_cost'),
                    DB::raw('COUNT(*) as maintenance_count')
                )
                ->groupBy('tyres.current_vehicle_id')
                ->get();
            
            // Spare Parts
            $sparePartCosts = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0)
                ->where('component_type', 'spare_part')
                ->when($dateFrom, fn($q) => $q->whereDate('performed_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('performed_at', '<=', $dateTo))
                ->when($componentType !== 'battery' && $componentType !== 'tyre', fn($q) => $q)
                ->join('spare_parts', 'component_maintenance.component_id', '=', 'spare_parts.id')
                ->whereNotNull('spare_parts.current_vehicle_id')
                ->when($vehicleId, fn($q) => $q->where('spare_parts.current_vehicle_id', $vehicleId))
                ->select(
                    'spare_parts.current_vehicle_id as vehicle_id',
                    DB::raw('SUM(component_maintenance.cost) as total_cost'),
                    DB::raw('COUNT(*) as maintenance_count')
                )
                ->groupBy('spare_parts.current_vehicle_id')
                ->get();
            
            // Combine and aggregate by vehicle
            $costPerVehicle = collect([...$batteryCosts, ...$tyreCosts, ...$sparePartCosts])
                ->groupBy('vehicle_id')
                ->map(function($items, $vehicleId) {
                    return [
                        'vehicle_id' => $vehicleId,
                        'total_cost' => (float) $items->sum('total_cost'),
                        'maintenance_count' => (int) $items->sum('maintenance_count'),
                    ];
                })
                ->values()
                ->map(function($item) {
                    $vehicle = null;
                    $vehicleName = 'Unknown Vehicle';
                    
                    try {
                        $vehicle = \App\Models\Vehicle::find($item['vehicle_id']);
                        if ($vehicle) {
                            $vehicleName = $vehicle->registration_number . ' - ' . trim(($vehicle->make ?? '') . ' ' . ($vehicle->model ?? ''));
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load vehicle for cost analysis: ' . $e->getMessage());
                    }
                    
                    return [
                        'vehicle_id' => $item['vehicle_id'],
                        'vehicle_name' => $vehicleName,
                        'total_cost' => $item['total_cost'],
                        'maintenance_count' => $item['maintenance_count'],
                    ];
                })
                ->sortByDesc('total_cost')
                ->take(20)
                ->values();
            
            // Get monthly cost trend
            $monthlyTrend = ComponentMaintenance::whereNotNull('cost')
                ->where('cost', '>', 0)
                ->when($dateFrom, fn($q) => $q->whereDate('performed_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('performed_at', '<=', $dateTo))
                ->when($componentType, fn($q) => $q->where('component_type', $componentType))
                ->select(
                    DB::raw('DATE_FORMAT(performed_at, "%Y-%m") as month'),
                    DB::raw('SUM(cost) as total_cost'),
                    DB::raw('COUNT(*) as maintenance_count')
                )
                ->groupBy('month')
                ->orderBy('month', 'asc')
                ->get()
                ->map(function($item) {
                    return [
                        'month' => $item->month,
                        'total_cost' => (float) $item->total_cost,
                        'maintenance_count' => (int) $item->maintenance_count,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_cost' => $totalCost,
                    'cost_by_type' => $costByType,
                    'cost_per_component' => $costPerComponent,
                    'cost_per_vehicle' => $costPerVehicle,
                    'monthly_trend' => $monthlyTrend,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch cost analysis: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch cost analysis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get component health dashboard data
     * GET /api/v1/components/health-dashboard
     */
    public function healthDashboard(Request $request): JsonResponse
    {
        try {
            // Components with warranty expiring in 30 days
            $warrantyExpiring = collect();
            $warrantyThreshold = now()->addDays(30);
            
            // Check batteries
            $batteriesExpiring = Battery::whereNotNull('warranty_expires_at')
                ->where('warranty_expires_at', '<=', $warrantyThreshold)
                ->where('warranty_expires_at', '>=', now())
                ->with('currentVehicle')
                ->get()
                ->map(function($battery) {
                    $daysUntilExpiry = now()->diffInDays($battery->warranty_expires_at, false);
                    return [
                        'component_type' => 'battery',
                        'component_id' => $battery->id,
                        'component_name' => trim(($battery->brand ?? '') . ' ' . ($battery->model ?? '')) ?: ($battery->serial_number ?? 'Battery'),
                        'warranty_expires_at' => $battery->warranty_expires_at?->format('Y-m-d'),
                        'days_until_expiry' => $daysUntilExpiry,
                        'current_vehicle' => $battery->currentVehicle ? [
                            'id' => $battery->currentVehicle->id,
                            'registration_number' => $battery->currentVehicle->registration_number,
                        ] : null,
                    ];
                });
            
            // Check tyres
            $tyresExpiring = Tyre::whereNotNull('warranty_expires_at')
                ->where('warranty_expires_at', '<=', $warrantyThreshold)
                ->where('warranty_expires_at', '>=', now())
                ->with('currentVehicle')
                ->get()
                ->map(function($tyre) {
                    $daysUntilExpiry = now()->diffInDays($tyre->warranty_expires_at, false);
                    return [
                        'component_type' => 'tyre',
                        'component_id' => $tyre->id,
                        'component_name' => trim(($tyre->brand ?? '') . ' ' . ($tyre->model ?? '')) ?: ($tyre->serial_number ?? 'Tyre'),
                        'warranty_expires_at' => $tyre->warranty_expires_at?->format('Y-m-d'),
                        'days_until_expiry' => $daysUntilExpiry,
                        'current_vehicle' => $tyre->currentVehicle ? [
                            'id' => $tyre->currentVehicle->id,
                            'registration_number' => $tyre->currentVehicle->registration_number,
                        ] : null,
                    ];
                });
            
            // Check spare parts
            $sparePartsExpiring = SparePart::whereNotNull('warranty_expires_at')
                ->where('warranty_expires_at', '<=', $warrantyThreshold)
                ->where('warranty_expires_at', '>=', now())
                ->with('currentVehicle')
                ->get()
                ->map(function($sparePart) {
                    $daysUntilExpiry = now()->diffInDays($sparePart->warranty_expires_at, false);
                    return [
                        'component_type' => 'spare_part',
                        'component_id' => $sparePart->id,
                        'component_name' => $sparePart->name ?? 'Spare Part',
                        'warranty_expires_at' => $sparePart->warranty_expires_at?->format('Y-m-d'),
                        'days_until_expiry' => $daysUntilExpiry,
                        'current_vehicle' => $sparePart->currentVehicle ? [
                            'id' => $sparePart->currentVehicle->id,
                            'registration_number' => $sparePart->currentVehicle->registration_number,
                        ] : null,
                    ];
                });
            
            $warrantyExpiring = $warrantyExpiring->merge($batteriesExpiring)
                ->merge($tyresExpiring)
                ->merge($sparePartsExpiring)
                ->sortBy('days_until_expiry')
                ->values();
            
            // Overdue maintenance
            $overdueMaintenance = ComponentMaintenance::whereNotNull('next_due_date')
                ->where('next_due_date', '<', now())
                ->with('performedBy')
                ->get()
                ->map(function($maintenance) {
                    $component = $maintenance->component();
                    $componentName = 'Unknown Component';
                    
                    if ($component) {
                        if ($maintenance->component_type === 'spare_part') {
                            $componentName = $component->name ?? 'Spare Part';
                        } else {
                            $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                            if (empty($componentName)) {
                                $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                            }
                        }
                    }
                    
                    $daysOverdue = now()->diffInDays($maintenance->next_due_date, false);
                    
                    return [
                        'id' => $maintenance->id,
                        'component_type' => $maintenance->component_type,
                        'component_id' => $maintenance->component_id,
                        'component_name' => $componentName,
                        'title' => $maintenance->title,
                        'next_due_date' => $maintenance->next_due_date?->format('Y-m-d'),
                        'days_overdue' => abs($daysOverdue),
                        'performed_by' => $maintenance->performedBy ? [
                            'id' => $maintenance->performedBy->id,
                            'name' => $maintenance->performedBy->name,
                        ] : null,
                    ];
                })
                ->sortByDesc('days_overdue')
                ->values();
            
            // Upcoming maintenance (next 30 days)
            $upcomingMaintenance = ComponentMaintenance::whereNotNull('next_due_date')
                ->where('next_due_date', '>=', now())
                ->where('next_due_date', '<=', now()->addDays(30))
                ->with('performedBy')
                ->get()
                ->map(function($maintenance) {
                    $component = $maintenance->component();
                    $componentName = 'Unknown Component';
                    
                    if ($component) {
                        if ($maintenance->component_type === 'spare_part') {
                            $componentName = $component->name ?? 'Spare Part';
                        } else {
                            $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                            if (empty($componentName)) {
                                $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                            }
                        }
                    }
                    
                    $daysUntilDue = now()->diffInDays($maintenance->next_due_date, false);
                    
                    return [
                        'id' => $maintenance->id,
                        'component_type' => $maintenance->component_type,
                        'component_id' => $maintenance->component_id,
                        'component_name' => $componentName,
                        'title' => $maintenance->title,
                        'next_due_date' => $maintenance->next_due_date?->format('Y-m-d'),
                        'days_until_due' => $daysUntilDue,
                        'performed_by' => $maintenance->performedBy ? [
                            'id' => $maintenance->performedBy->id,
                            'name' => $maintenance->performedBy->name,
                        ] : null,
                    ];
                })
                ->sortBy('days_until_due')
                ->values();
            
            // Component health scores (based on maintenance history, warranty status, etc.)
            $allComponents = collect();
            
            // Get all components with their health scores
            $batteries = Battery::with('currentVehicle')->get();
            $tyres = Tyre::with('currentVehicle')->get();
            $spareParts = SparePart::with('currentVehicle')->get();
            
            foreach ($batteries as $battery) {
                $healthScore = $this->calculateHealthScore('battery', $battery->id, $battery);
                $allComponents->push([
                    'component_type' => 'battery',
                    'component_id' => $battery->id,
                    'component_name' => trim(($battery->brand ?? '') . ' ' . ($battery->model ?? '')) ?: ($battery->serial_number ?? 'Battery'),
                    'health_score' => $healthScore,
                    'status' => $battery->status,
                    'current_vehicle' => $battery->currentVehicle ? [
                        'id' => $battery->currentVehicle->id,
                        'registration_number' => $battery->currentVehicle->registration_number,
                    ] : null,
                ]);
            }
            
            foreach ($tyres as $tyre) {
                $healthScore = $this->calculateHealthScore('tyre', $tyre->id, $tyre);
                $allComponents->push([
                    'component_type' => 'tyre',
                    'component_id' => $tyre->id,
                    'component_name' => trim(($tyre->brand ?? '') . ' ' . ($tyre->model ?? '')) ?: ($tyre->serial_number ?? 'Tyre'),
                    'health_score' => $healthScore,
                    'status' => $tyre->status,
                    'current_vehicle' => $tyre->currentVehicle ? [
                        'id' => $tyre->currentVehicle->id,
                        'registration_number' => $tyre->currentVehicle->registration_number,
                    ] : null,
                ]);
            }
            
            foreach ($spareParts as $sparePart) {
                $healthScore = $this->calculateHealthScore('spare_part', $sparePart->id, $sparePart);
                $allComponents->push([
                    'component_type' => 'spare_part',
                    'component_id' => $sparePart->id,
                    'component_name' => $sparePart->name ?? 'Spare Part',
                    'health_score' => $healthScore,
                    'status' => $sparePart->status,
                    'current_vehicle' => $sparePart->currentVehicle ? [
                        'id' => $sparePart->currentVehicle->id,
                        'registration_number' => $sparePart->currentVehicle->registration_number,
                    ] : null,
                ]);
            }
            
            // Summary statistics
            $totalComponents = $allComponents->count();
            $healthyComponents = $allComponents->where('health_score', '>=', 70)->count();
            $warningComponents = $allComponents->where('health_score', '>=', 50)->where('health_score', '<', 70)->count();
            $criticalComponents = $allComponents->where('health_score', '<', 50)->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_components' => $totalComponents,
                        'healthy_components' => $healthyComponents,
                        'warning_components' => $warningComponents,
                        'critical_components' => $criticalComponents,
                        'warranty_expiring_count' => $warrantyExpiring->count(),
                        'overdue_maintenance_count' => $overdueMaintenance->count(),
                        'upcoming_maintenance_count' => $upcomingMaintenance->count(),
                    ],
                    'warranty_expiring' => $warrantyExpiring,
                    'overdue_maintenance' => $overdueMaintenance,
                    'upcoming_maintenance' => $upcomingMaintenance,
                    'component_health' => $allComponents->sortByDesc('health_score')->values(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch health dashboard: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch health dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate health score for a component (0-100)
     */
    protected function calculateHealthScore(string $componentType, string $componentId, $component): int
    {
        $score = 100;
        
        // Check warranty status
        if ($component->warranty_expires_at) {
            if ($component->warranty_expires_at->isPast()) {
                $score -= 20; // Warranty expired
            } elseif ($component->warranty_expires_at->diffInDays(now()) <= 30) {
                $score -= 10; // Warranty expiring soon
            }
        }
        
        // Check maintenance status
        $overdueMaintenance = ComponentMaintenance::where('component_type', $componentType)
            ->where('component_id', $componentId)
            ->whereNotNull('next_due_date')
            ->where('next_due_date', '<', now())
            ->count();
        
        if ($overdueMaintenance > 0) {
            $score -= min(30, $overdueMaintenance * 10); // -10 per overdue maintenance, max -30
        }
        
        // Check component status
        if ($component->status === 'needs_replacement') {
            $score -= 40;
        } elseif ($component->status === 'maintenance') {
            $score -= 20;
        } elseif ($component->status === 'retired') {
            $score = 0;
        }
        
        // Check for tyres - tread depth
        if ($componentType === 'tyre' && isset($component->tread_depth_mm)) {
            if ($component->tread_depth_mm < 1.6) {
                $score -= 30; // Below legal minimum
            } elseif ($component->tread_depth_mm < 3.0) {
                $score -= 15; // Getting low
            }
        }
        
        return max(0, min(100, $score));
    }
}

