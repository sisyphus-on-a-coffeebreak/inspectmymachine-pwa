<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QRCodeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Gate Pass Record Controller
 * 
 * Handles unified gate pass record synchronization and ensures QR payloads
 * are always present for verifiable QR code generation.
 */
class GatePassRecordController extends Controller
{
    protected $qrCodeService;

    public function __construct(QRCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Sync gate pass record - ensures QR payload exists
     * POST /api/gate-pass-records/sync
     * 
     * This endpoint is critical for QR code generation. It MUST always return
     * a qr_payload field containing verifiable pass information.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function sync(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pass_id' => 'required|string',
            'pass_type' => 'required|in:visitor,vehicle',
            'metadata' => 'nullable|array',
            'access_code' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $passId = $request->input('pass_id');
            $passType = $request->input('pass_type');
            $metadata = $request->input('metadata', []);
            $preferredAccessCode = $request->input('access_code');

            // Determine which table to use
            $tableName = $this->getTableName($passType);
            
            // Check if record exists
            $record = DB::table($tableName)->where('id', $passId)->first();

            if (!$record) {
                // Create new record if it doesn't exist
                $accessCode = $preferredAccessCode ?? $this->generateAccessCode();
                $qrData = $this->qrCodeService->generatePayload($passId, $passType);

                DB::table($tableName)->insert([
                    'id' => $passId,
                    'access_code' => $accessCode,
                    'qr_payload' => $qrData['qr_payload'],
                    'qr_token' => $qrData['qr_token'],
                    'qr_expires_at' => $qrData['qr_expires_at'],
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $record = DB::table($tableName)->where('id', $passId)->first();
            } else {
                // Ensure QR payload exists for existing records
                if (empty($record->qr_payload) || empty($record->qr_token)) {
                    $qrData = $this->qrCodeService->generatePayload($passId, $passType);
                    
                    DB::table($tableName)
                        ->where('id', $passId)
                        ->update([
                            'qr_payload' => $qrData['qr_payload'],
                            'qr_token' => $qrData['qr_token'],
                            'qr_expires_at' => $qrData['qr_expires_at'],
                            'updated_at' => now(),
                        ]);

                    // Refresh record
                    $record = DB::table($tableName)->where('id', $passId)->first();
                }

                // Update access code if preferred one provided
                if ($preferredAccessCode && $record->access_code !== $preferredAccessCode) {
                    DB::table($tableName)
                        ->where('id', $passId)
                        ->update([
                            'access_code' => $preferredAccessCode,
                            'updated_at' => now(),
                        ]);
                    
                    $record = DB::table($tableName)->where('id', $passId)->first();
                }
            }

            // CRITICAL: Ensure qr_payload is always present
            if (empty($record->qr_payload)) {
                Log::error('Gate pass record missing QR payload after sync', [
                    'pass_id' => $passId,
                    'pass_type' => $passType,
                ]);
                
                // Generate as fallback
                $qrData = $this->qrCodeService->generatePayload($passId, $passType);
                $record->qr_payload = $qrData['qr_payload'];
            }

            // Format pass number
            $passNumber = $this->formatPassNumber($passType, $passId, $record);

            Log::info('Gate pass record synced', [
                'pass_id' => $passId,
                'pass_type' => $passType,
                'has_qr_payload' => !empty($record->qr_payload),
            ]);

            return response()->json([
                'success' => true,
                'record' => [
                    'id' => $record->id,
                    'access_code' => $record->access_code,
                    'qr_payload' => $record->qr_payload, // CRITICAL: Always present
                    'qr_token' => $record->qr_token ?? null,
                    'qr_expires_at' => $record->qr_expires_at ?? null,
                    'pass_number' => $passNumber,
                    'metadata' => array_merge($metadata, [
                        'passType' => $passType,
                        'passNumber' => $passNumber,
                    ]),
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error syncing gate pass record: ' . $e->getMessage(), [
                'pass_id' => $request->input('pass_id'),
                'pass_type' => $request->input('pass_type'),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to sync gate pass record',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get table name for pass type
     */
    private function getTableName(string $passType): string
    {
        return match($passType) {
            'visitor' => 'visitor_gate_passes',
            'vehicle' => 'vehicle_entry_passes', // Default to entry for vehicle
            default => throw new \InvalidArgumentException("Invalid pass type: {$passType}"),
        };
    }

    /**
     * Generate access code
     */
    private function generateAccessCode(): string
    {
        return strtoupper(Str::random(6));
    }

    /**
     * List all gate pass records (unified)
     * GET /api/gate-pass-records
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('visitor_gate_passes')
                ->select(
                    'id',
                    DB::raw("'visitor' as type"),
                    DB::raw("CONCAT('VP', UPPER(SUBSTRING(id, 1, 8))) as pass_number"),
                    'visitor_name as name',
                    'status',
                    'valid_from',
                    'valid_to',
                    'entry_time',
                    'exit_time',
                    'created_at',
                    'updated_at'
                );

            // Also get vehicle passes
            $vehiclePasses = DB::table('vehicle_exit_passes')
                ->select(
                    'id',
                    DB::raw("'vehicle' as type"),
                    DB::raw("CONCAT('VX', UPPER(SUBSTRING(id, 1, 8))) as pass_number"),
                    DB::raw("CONCAT(driver_name, ' - Vehicle') as name"),
                    'status',
                    'valid_from',
                    'valid_to',
                    'exit_time as entry_time',
                    'entry_time as exit_time',
                    'created_at',
                    'updated_at'
                );

            // Apply filters
            if ($request->has('status')) {
                $query->where('visitor_gate_passes.status', $request->input('status'));
                $vehiclePasses->where('vehicle_exit_passes.status', $request->input('status'));
            }

            if ($request->has('type') && $request->input('type') !== 'all') {
                if ($request->input('type') === 'visitor') {
                    $vehiclePasses = collect([]);
                } else {
                    $query = collect([]);
                }
            }

            // Combine results
            $visitorResults = $query->get();
            $vehicleResults = $vehiclePasses->get();
            $allPasses = $visitorResults->merge($vehicleResults);

            // Pagination
            $perPage = $request->input('per_page', 50);
            $page = $request->input('page', 1);
            $total = $allPasses->count();
            $offset = ($page - 1) * $perPage;
            $paginated = $allPasses->slice($offset, $perPage)->values();

            return response()->json([
                'data' => $paginated,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch gate pass records: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch gate pass records'], 500);
        }
    }

    /**
     * Get dashboard statistics
     * GET /api/gate-pass-records/stats
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $yardId = $request->input('yard_id');

            // Visitors inside (active status)
            $visitorsInside = DB::table('visitor_gate_passes')
                ->where('status', 'active')
                ->when($yardId, fn($q) => $q->where('yard_id', $yardId))
                ->count();

            // Vehicles out (active status on exit passes)
            // Note: yard_id might not exist on vehicle_exit_passes; don't filter by yard here
            $vehiclesOut = DB::table('vehicle_exit_passes')
                ->where('status', 'active')
                ->count();

            // Expected today
            $expectedToday = DB::table('visitor_gate_passes')
                ->whereDate('valid_from', '<=', now())
                ->whereDate('valid_to', '>=', now())
                ->when($yardId, fn($q) => $q->where('yard_id', $yardId))
                ->count();

            // Total today
            $totalToday = DB::table('visitor_gate_passes')
                ->whereDate('created_at', today())
                ->when($yardId, fn($q) => $q->where('yard_id', $yardId))
                ->count();

            // Pending approvals
            $pendingApprovals = DB::table('approval_requests')
                ->where('status', 'pending')
                ->where('requestable_type', 'like', '%GatePass%')
                ->when($yardId, function($q) use ($yardId) {
                    // Join with gate passes to filter by yard_id if needed
                    return $q;
                })
                ->count();

            return response()->json([
                'visitors_inside' => $visitorsInside,
                'vehicles_out' => $vehiclesOut,
                'expected_today' => $expectedToday,
                'total_today' => $totalToday,
                'pending_approvals' => $pendingApprovals,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch gate pass stats: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch stats'], 500);
        }
    }

    /**
     * Format pass number
     */
    private function formatPassNumber(string $passType, string $passId, $record): string
    {
        // Check if pass_number exists in record
        if (isset($record->pass_number) && !empty($record->pass_number)) {
            return $record->pass_number;
        }

        // Generate from ID
        $prefix = $passType === 'visitor' ? 'VP' : 'VM';
        return $prefix . strtoupper(substr($passId, 0, 8));
    }
}

