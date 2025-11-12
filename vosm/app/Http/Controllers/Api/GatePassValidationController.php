<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QRCodeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Gate Pass Validation Controller
 * 
 * Handles QR code validation and pass verification for guards.
 * Supports both QR token URLs and access codes.
 */
class GatePassValidationController extends Controller
{
    protected $qrCodeService;

    public function __construct(QRCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Validate a gate pass (by QR token URL or access code)
     * POST /api/gate-pass-validation/validate
     */
    public function validate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'access_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $identifier = $request->input('access_code');
            
            // Extract token from URL if QR code contains a URL
            $token = $this->extractTokenFromUrl($identifier);
            
            // If token extracted, validate using QR token
            if ($token) {
                $passData = $this->qrCodeService->verifyToken($token);
                
                if ($passData) {
                    return $this->formatValidationResponse($passData, true);
                }
            }
            
            // Fallback: Try to validate by access_code
            $passData = $this->findPassByAccessCode($identifier);
            
            if ($passData) {
                return $this->formatValidationResponse($passData, true);
            }
            
            // Not found
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired pass. Please check the QR code or access code.',
                'validation_type' => 'invalid'
            ], 404);
            
        } catch (\Exception $e) {
            Log::error('Gate pass validation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed. Please try again.',
                'validation_type' => 'invalid'
            ], 500);
        }
    }

    /**
     * Verify QR token (GET endpoint for direct URL access)
     * GET /api/gate-pass-validation/verify?token=...
     */
    public function verify(Request $request): JsonResponse
    {
        $token = $request->query('token');
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token is required'
            ], 400);
        }

        try {
            $passData = $this->qrCodeService->verifyToken($token);
            
            if ($passData) {
                return $this->formatValidationResponse($passData, true);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token',
                'validation_type' => 'invalid'
            ], 404);
        } catch (\Exception $e) {
            Log::error('QR token verification failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Verification failed'
            ], 500);
        }
    }

    /**
     * Process entry
     * POST /api/gate-pass-validation/entry
     */
    public function entry(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pass_id' => 'required|string',
            'pass_type' => 'required|in:visitor,vehicle_entry,vehicle_exit',
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
            $passId = $request->input('pass_id');
            $passType = $request->input('pass_type');
            $tableName = $this->getTableName($passType);
            
            $pass = DB::table($tableName)->where('id', $passId)->first();
            
            if (!$pass) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pass not found'
                ], 404);
            }

            DB::table($tableName)
                ->where('id', $passId)
                ->update([
                    'status' => 'active',
                    'entry_time' => now(),
                    'updated_at' => now(),
                ]);

            Log::info('Gate pass entry recorded', [
                'pass_id' => $passId,
                'pass_type' => $passType,
                'recorded_by' => $request->user()->id,
            ]);

            $updatedPass = DB::table($tableName)->where('id', $passId)->first();
            
            return response()->json([
                'success' => true,
                'message' => 'Entry recorded successfully',
                'entry_time' => $updatedPass->entry_time,
                'pass_data' => $this->formatPassData($updatedPass, $passType),
            ]);
        } catch (\Exception $e) {
            Log::error('Entry processing failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record entry'
            ], 500);
        }
    }

    /**
     * Process exit
     * POST /api/gate-pass-validation/exit
     */
    public function exit(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pass_id' => 'required|string',
            'pass_type' => 'required|in:visitor,vehicle_entry,vehicle_exit',
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
            $passId = $request->input('pass_id');
            $passType = $request->input('pass_type');
            $tableName = $this->getTableName($passType);
            
            $pass = DB::table($tableName)->where('id', $passId)->first();
            
            if (!$pass) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pass not found'
                ], 404);
            }

            DB::table($tableName)
                ->where('id', $passId)
                ->update([
                    'status' => 'completed',
                    'exit_time' => now(),
                    'updated_at' => now(),
                ]);

            Log::info('Gate pass exit recorded', [
                'pass_id' => $passId,
                'pass_type' => $passType,
                'recorded_by' => $request->user()->id,
            ]);

            $updatedPass = DB::table($tableName)->where('id', $passId)->first();
            
            return response()->json([
                'success' => true,
                'message' => 'Exit recorded successfully',
                'exit_time' => $updatedPass->exit_time,
                'pass_data' => $this->formatPassData($updatedPass, $passType),
            ]);
        } catch (\Exception $e) {
            Log::error('Exit processing failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record exit'
            ], 500);
        }
    }

    /**
     * Extract token from URL
     */
    private function extractTokenFromUrl(string $input): ?string
    {
        // If it's a URL, extract the token parameter
        if (filter_var($input, FILTER_VALIDATE_URL)) {
            $parsed = parse_url($input);
            if (isset($parsed['query'])) {
                parse_str($parsed['query'], $params);
                return $params['token'] ?? null;
            }
        }
        
        // If it's just a token (32 char alphanumeric), return as-is
        if (preg_match('/^[a-zA-Z0-9]{32}$/', $input)) {
            return $input;
        }
        
        return null;
    }

    /**
     * Find pass by access code
     */
    private function findPassByAccessCode(string $accessCode): ?array
    {
        // Check visitor passes
        $visitorPass = DB::table('visitor_gate_passes')
            ->where('access_code', $accessCode)
            ->first();
        
        if ($visitorPass) {
            return [
                'pass_id' => $visitorPass->id,
                'pass_type' => 'visitor',
                'pass_number' => $visitorPass->pass_number ?? 'VP' . strtoupper(substr($visitorPass->id, 0, 8)),
                'visitor_name' => $visitorPass->visitor_name ?? null,
                'status' => $visitorPass->status ?? null,
                'valid_from' => $visitorPass->valid_from ?? null,
                'valid_to' => $visitorPass->valid_to ?? null,
            ];
        }
        
        // Check vehicle exit passes
        $exitPass = DB::table('vehicle_exit_passes')
            ->where('access_code', $accessCode)
            ->first();
        
        if ($exitPass) {
            return [
                'pass_id' => $exitPass->id,
                'pass_type' => 'vehicle',
                'pass_number' => $exitPass->pass_number ?? 'VX' . strtoupper(substr($exitPass->id, 0, 8)),
                'vehicle_id' => $exitPass->vehicle_id ?? null,
                'status' => $exitPass->status ?? null,
                'valid_from' => $exitPass->valid_from ?? null,
                'valid_to' => $exitPass->valid_to ?? null,
            ];
        }
        
        // Check vehicle entry passes
        $entryPass = DB::table('vehicle_entry_passes')
            ->where('access_code', $accessCode)
            ->first();
        
        if ($entryPass) {
            return [
                'pass_id' => $entryPass->id,
                'pass_type' => 'vehicle',
                'pass_number' => $entryPass->pass_number ?? 'VE' . strtoupper(substr($entryPass->id, 0, 8)),
                'vehicle_id' => $entryPass->vehicle_id ?? null,
                'status' => $entryPass->status ?? null,
                'valid_from' => $entryPass->valid_from ?? null,
                'valid_to' => $entryPass->valid_to ?? null,
            ];
        }
        
        return null;
    }

    /**
     * Format validation response
     */
    private function formatValidationResponse(array $passData, bool $success): JsonResponse
    {
        $passType = $passData['pass_type'] === 'visitor' ? 'visitor' : 'vehicle';
        
        // Get full pass details
        $tableName = $this->getTableName($passData['pass_type']);
        $fullPass = DB::table($tableName)->where('id', $passData['pass_id'])->first();
        
        if (!$fullPass) {
            return response()->json([
                'success' => false,
                'message' => 'Pass not found',
                'validation_type' => 'invalid'
            ], 404);
        }
        
        $formattedPass = $this->formatPassData($fullPass, $passData['pass_type']);
        
        // Check if pass is valid (not expired, correct status)
        $isValid = $this->isPassValid($fullPass);
        
        return response()->json([
            'success' => $success && $isValid,
            'message' => $isValid 
                ? 'Pass validated successfully' 
                : 'Pass is expired or invalid',
            'validation_type' => $isValid ? 'entry' : 'invalid',
            'pass_data' => $formattedPass,
        ]);
    }

    /**
     * Format pass data for response
     */
    private function formatPassData($pass, string $passType): array
    {
        $baseData = [
            'id' => $pass->id,
            'pass_number' => $pass->pass_number ?? ($passType === 'visitor' ? 'VP' : 'VM') . strtoupper(substr($pass->id, 0, 8)),
            'type' => $passType === 'visitor' ? 'visitor' : 'vehicle',
            'status' => $pass->status ?? 'pending',
            'valid_from' => $pass->valid_from ?? null,
            'valid_to' => $pass->valid_to ?? null,
            'entry_time' => $pass->entry_time ?? null,
            'exit_time' => $pass->exit_time ?? null,
            'access_code' => $pass->access_code ?? null,
            'qr_code' => $pass->qr_payload ?? null,
            'escort_required' => $pass->escort_required ?? false,
            'escort_name' => $pass->escort_name ?? null,
            'notes' => $pass->notes ?? null,
        ];
        
        if ($passType === 'visitor') {
            $baseData['visitor_name'] = $pass->visitor_name ?? null;
            $baseData['visitor_phone'] = $pass->visitor_phone ?? null;
            $baseData['purpose'] = $pass->purpose ?? 'other';
        } else {
            $baseData['vehicle_registration'] = null; // Would need to join with vehicles table
            $baseData['purpose'] = $pass->purpose ?? 'other';
        }
        
        return $baseData;
    }

    /**
     * Check if pass is valid
     */
    private function isPassValid($pass): bool
    {
        // Check if expired
        if ($pass->valid_to && now() > $pass->valid_to) {
            return false;
        }
        
        // Check if not yet valid
        if ($pass->valid_from && now() < $pass->valid_from) {
            return false;
        }
        
        // Check status
        $invalidStatuses = ['cancelled', 'completed'];
        if (in_array($pass->status, $invalidStatuses)) {
            return false;
        }
        
        return true;
    }

    /**
     * Get table name for pass type
     */
    private function getTableName(string $passType): string
    {
        return match($passType) {
            'visitor' => 'visitor_gate_passes',
            'vehicle_entry' => 'vehicle_entry_passes',
            'vehicle_exit' => 'vehicle_exit_passes',
            'vehicle' => 'vehicle_exit_passes', // Default for vehicle
            default => throw new \InvalidArgumentException("Invalid pass type: {$passType}"),
        };
    }
}

