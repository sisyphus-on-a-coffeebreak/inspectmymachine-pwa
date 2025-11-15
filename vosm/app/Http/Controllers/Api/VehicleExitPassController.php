<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QRCodeService;
use App\Models\Battery;
use App\Models\Tyre;
use App\Models\SparePart;
use App\Models\ComponentCustodyHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VehicleExitPassController extends Controller
{
    protected $qrCodeService;

    public function __construct(QRCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Create a new vehicle exit pass
     * POST /api/vehicle-exit-passes
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|exists:vehicles,id',
            'purpose' => 'required|in:rto_work,sold,test_drive,service,auction,other',
            'driver_name' => 'nullable|string|max:255',
            'driver_contact' => 'nullable|string|max:20',
            'driver_license_number' => 'nullable|string|max:50',
            'expected_return_date' => 'nullable|date',
            'expected_return_time' => 'nullable|string',
            'destination' => 'nullable|string|max:255',
            'valid_from' => 'required|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
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
            $passId = (string) Str::uuid();
            
            // Generate access code (6-digit)
            $accessCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

            // Generate QR code payload
            $qrData = $this->qrCodeService->generatePayload($passId, 'vehicle_exit');

            // Create vehicle exit pass
            DB::table('vehicle_exit_passes')->insert([
                'id' => $passId,
                'vehicle_id' => $request->input('vehicle_id'),
                'purpose' => $request->input('purpose'),
                'driver_name' => $request->input('driver_name'),
                'driver_contact' => $request->input('driver_contact'),
                'driver_license_number' => $request->input('driver_license_number'),
                'expected_return_date' => $request->input('expected_return_date'),
                'expected_return_time' => $request->input('expected_return_time'),
                'destination' => $request->input('destination'),
                'valid_from' => $request->input('valid_from'),
                'valid_to' => $request->input('valid_to') ?? $request->input('valid_from'),
                'access_code' => $accessCode,
                'qr_payload' => $qrData['qr_payload'],
                'qr_token' => $qrData['qr_token'],
                'qr_expires_at' => $qrData['qr_expires_at'],
                'status' => 'pending',
                'requires_approval' => false,
                'approval_status' => 'not_required',
                'notes' => $request->input('notes'),
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            Log::info('Vehicle exit pass created', [
                'pass_id' => $passId,
                'vehicle_id' => $request->input('vehicle_id'),
                'created_by' => $user->id
            ]);

            // Handle component transfers if vehicle is being sold or auctioned
            $purpose = $request->input('purpose');
            if (in_array($purpose, ['sold', 'auction'])) {
                $this->handleComponentTransfersOnExit($request->input('vehicle_id'), $passId, $user->id);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Vehicle exit pass created successfully',
                'pass' => [
                    'id' => $passId,
                    'pass_number' => 'VX' . strtoupper(substr($passId, 0, 8)),
                    'vehicle_id' => $request->input('vehicle_id'),
                    'access_code' => $accessCode,
                    'qr_payload' => $qrData['qr_payload']
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating vehicle exit pass: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vehicle exit pass',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single vehicle exit pass
     * GET /api/vehicle-exit-passes/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $pass = DB::table('vehicle_exit_passes')->where('id', $id)->first();

            if (!$pass) {
                return response()->json(['error' => 'Gate pass not found'], 404);
            }

            // Get linked expenses
            $linkedExpenses = DB::table('expense_links')
                ->where('linked_type', 'vehicle_exit_pass')
                ->where('linked_id', $id)
                ->join('expenses', 'expense_links.expense_id', '=', 'expenses.id')
                ->select(
                    'expenses.id',
                    'expenses.amount',
                    'expenses.category',
                    'expenses.description',
                    'expenses.date',
                    'expenses.status',
                    'expense_links.link_reason',
                    'expense_links.confidence_score'
                )
                ->orderBy('expenses.date', 'desc')
                ->get()
                ->map(function($expense) {
                    return [
                        'id' => $expense->id,
                        'amount' => (float) $expense->amount,
                        'category' => $expense->category,
                        'description' => $expense->description,
                        'date' => $expense->date,
                        'status' => $expense->status,
                        'link_reason' => $expense->link_reason,
                        'confidence_score' => (float) $expense->confidence_score,
                    ];
                });

            // Get components that were on the vehicle when exit pass was created
            $custodyHistory = DB::table('component_custody_history')
                ->where('from_vehicle_id', $pass->vehicle_id)
                ->where('reason', 'like', "%exit pass #{$id}%")
                ->get()
                ->map(function($history) {
                    $component = null;
                    $componentName = 'Unknown Component';
                    
                    try {
                        $component = match($history->component_type) {
                            'battery' => Battery::find($history->component_id),
                            'tyre' => Tyre::find($history->component_id),
                            'spare_part' => SparePart::find($history->component_id),
                            default => null
                        };
                        
                        if ($component) {
                            if ($history->component_type === 'spare_part') {
                                $componentName = $component->name ?? 'Spare Part';
                            } else {
                                $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                                if (empty($componentName)) {
                                    $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to load component for exit pass: ' . $e->getMessage());
                    }
                    
                    return [
                        'component_type' => $history->component_type,
                        'component_id' => $history->component_id,
                        'component_name' => $componentName,
                        'transferred_at' => $history->transferred_at,
                    ];
                });

            return response()->json([
                'id' => $pass->id,
                'pass_number' => 'VX' . strtoupper(substr($pass->id, 0, 8)),
                'vehicle_id' => $pass->vehicle_id,
                'purpose' => $pass->purpose,
                'driver_name' => $pass->driver_name,
                'driver_contact' => $pass->driver_contact,
                'valid_from' => $pass->valid_from,
                'valid_to' => $pass->valid_to,
                'status' => $pass->status,
                'access_code' => $pass->access_code,
                'qr_payload' => $pass->qr_payload,
                'exit_time' => $pass->exit_time ?? null,
                'entry_time' => $pass->entry_time ?? null,
                'created_at' => $pass->created_at,
                'updated_at' => $pass->updated_at,
                'components_removed' => $custodyHistory,
                'linked_expenses' => $linkedExpenses,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching vehicle exit pass: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch vehicle exit pass'], 500);
        }
    }

    /**
     * List vehicle exit passes
     * GET /api/vehicle-exit-passes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('vehicle_exit_passes')
                ->orderBy('created_at', 'desc');

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $passes = $query->get()->map(function ($pass) {
                return [
                    'id' => $pass->id,
                    'pass_number' => 'VX' . strtoupper(substr($pass->id, 0, 8)),
                    'vehicle_id' => $pass->vehicle_id,
                    'purpose' => $pass->purpose,
                    'driver_name' => $pass->driver_name,
                    'valid_from' => $pass->valid_from,
                    'valid_to' => $pass->valid_to,
                    'status' => $pass->status,
                    'access_code' => $pass->access_code,
                    'qr_payload' => $pass->qr_payload,
                    'created_at' => $pass->created_at,
                    'updated_at' => $pass->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $passes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching vehicle exit passes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vehicle exit passes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark entry for a vehicle exit pass (when vehicle returns)
     * POST /api/vehicle-exit-passes/{id}/entry
     */
    public function entry(Request $request, string $id): JsonResponse
    {
        try {
            $pass = DB::table('vehicle_exit_passes')->where('id', $id)->first();

            if (!$pass) {
                return response()->json(['error' => 'Gate pass not found'], 404);
            }

            DB::table('vehicle_exit_passes')
                ->where('id', $id)
                ->update([
                    'status' => 'completed',
                    'entry_time' => now(),
                    'updated_at' => now(),
                ]);

            Log::info('Vehicle exit pass entry marked (vehicle returned)', [
                'pass_id' => $id,
                'marked_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Entry marked successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark entry: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark entry'], 500);
        }
    }

    /**
     * Mark exit for a vehicle exit pass (when vehicle leaves)
     * POST /api/vehicle-exit-passes/{id}/exit
     */
    public function exit(Request $request, string $id): JsonResponse
    {
        try {
            $pass = DB::table('vehicle_exit_passes')->where('id', $id)->first();

            if (!$pass) {
                return response()->json(['error' => 'Gate pass not found'], 404);
            }
            
            DB::table('vehicle_exit_passes')
                ->where('id', $id)
                ->update([
                    'status' => 'active',
                    'exit_time' => now(),
                    'updated_at' => now(),
                ]);

            // Handle component transfers when vehicle actually exits
            if ($pass && in_array($pass->purpose, ['sold', 'auction'])) {
                $this->handleComponentTransfersOnExit($pass->vehicle_id, $id, $request->user()->id);
            }

            Log::info('Vehicle exit pass exit marked (vehicle left)', [
                'pass_id' => $id,
                'marked_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Exit marked successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark exit: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark exit'], 500);
        }
    }

    /**
     * Update a vehicle exit pass
     * PUT /api/vehicle-exit-passes/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,active,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $pass = DB::table('vehicle_exit_passes')->where('id', $id)->first();

            if (!$pass) {
                return response()->json(['error' => 'Gate pass not found'], 404);
            }

            $updateData = [];
            if ($request->has('status')) {
                $updateData['status'] = $request->input('status');
            }
            if ($request->has('notes')) {
                $updateData['notes'] = $request->input('notes');
            }
            $updateData['updated_at'] = now();

            DB::table('vehicle_exit_passes')
                ->where('id', $id)
                ->update($updateData);

            Log::info('Vehicle exit pass updated', [
                'pass_id' => $id,
                'updated_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gate pass updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update vehicle exit pass: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update gate pass'], 500);
        }
    }

    /**
     * Handle component transfers when vehicle exits
     * Removes components from vehicle and creates custody history
     */
    protected function handleComponentTransfersOnExit(string $vehicleId, string $exitPassId, string $userId): void
    {
        try {
            // Get all components currently on this vehicle
            $batteries = Battery::where('current_vehicle_id', $vehicleId)->get();
            $tyres = Tyre::where('current_vehicle_id', $vehicleId)->get();
            $spareParts = SparePart::where('current_vehicle_id', $vehicleId)->get();
            
            $allComponents = collect()
                ->merge($batteries->map(fn($b) => ['type' => 'battery', 'id' => $b->id, 'component' => $b]))
                ->merge($tyres->map(fn($t) => ['type' => 'tyre', 'id' => $t->id, 'component' => $t]))
                ->merge($spareParts->map(fn($s) => ['type' => 'spare_part', 'id' => $s->id, 'component' => $s]));
            
            foreach ($allComponents as $item) {
                $component = $item['component'];
                $componentType = $item['type'];
                
                // Create custody history record
                ComponentCustodyHistory::create([
                    'component_type' => $componentType,
                    'component_id' => $component->id,
                    'from_vehicle_id' => $vehicleId,
                    'to_vehicle_id' => null,
                    'transferred_by' => $userId,
                    'transfer_type' => 'remove',
                    'reason' => "Vehicle exit pass #{$exitPassId} - Vehicle sold/auctioned",
                    'transferred_at' => now(),
                ]);
                
                // Remove component from vehicle
                $component->update([
                    'current_vehicle_id' => null,
                    'status' => $componentType === 'tyre' ? 'in_stock' : ($componentType === 'battery' ? 'in_stock' : 'in_stock'),
                ]);
            }
            
            if ($allComponents->count() > 0) {
                Log::info('Components removed from vehicle on exit', [
                    'vehicle_id' => $vehicleId,
                    'exit_pass_id' => $exitPassId,
                    'components_count' => $allComponents->count(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to handle component transfers on exit: ' . $e->getMessage(), [
                'vehicle_id' => $vehicleId,
                'exit_pass_id' => $exitPassId,
            ]);
            // Don't throw - component transfer failure shouldn't block exit pass creation
        }
    }
}

