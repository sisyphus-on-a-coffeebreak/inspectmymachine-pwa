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

class VisitorGatePassController extends Controller
{
    protected $qrCodeService;

    public function __construct(QRCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Create a new visitor gate pass
     * POST /api/visitor-gate-passes
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'visitor_name' => 'required|string|max:255',
            'visitor_phone' => 'required|string|max:20',
            'visitor_company' => 'nullable|string|max:255',
            'vehicles_to_view' => 'nullable|array',
            'vehicles_to_view.*' => 'exists:vehicles,id',
            'purpose' => 'required|in:inspection,service,delivery,meeting,other',
            'valid_from' => 'required|date',
            'valid_to' => 'required|date|after_or_equal:valid_from',
            'yard_id' => 'nullable|uuid',
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
            $qrData = $this->qrCodeService->generatePayload($passId, 'visitor');

            // Create visitor gate pass
            DB::table('visitor_gate_passes')->insert([
                'id' => $passId,
                'visitor_name' => $request->input('visitor_name'),
                'visitor_phone' => $request->input('visitor_phone'),
                'visitor_company' => $request->input('visitor_company'),
                'vehicles_to_view' => $request->input('vehicles_to_view') ? json_encode($request->input('vehicles_to_view')) : null,
                'purpose' => $request->input('purpose'),
                'valid_from' => $request->input('valid_from'),
                'valid_to' => $request->input('valid_to'),
                'access_code' => $accessCode,
                'qr_payload' => $qrData['qr_payload'],
                'qr_token' => $qrData['qr_token'],
                'qr_expires_at' => $qrData['qr_expires_at'],
                'status' => 'pending',
                'requires_approval' => false,
                'approval_status' => 'not_required',
                'yard_id' => $request->input('yard_id'),
                'notes' => $request->input('notes'),
                'created_by_user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            Log::info('Visitor gate pass created', [
                'pass_id' => $passId,
                'visitor_name' => $request->input('visitor_name'),
                'created_by' => $user->id
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Visitor gate pass created successfully',
                'pass' => [
                    'id' => $passId,
                    'pass_number' => 'VP' . strtoupper(substr($passId, 0, 8)),
                    'visitor_name' => $request->input('visitor_name'),
                    'access_code' => $accessCode,
                    'qr_payload' => $qrData['qr_payload']
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating visitor gate pass: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create visitor gate pass',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List visitor gate passes
     * GET /api/visitor-gate-passes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('visitor_gate_passes')
                ->orderBy('created_at', 'desc');

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by date
            if ($request->has('date')) {
                $query->whereDate('valid_from', '<=', $request->input('date'))
                    ->whereDate('valid_to', '>=', $request->input('date'));
            }

            $passes = $query->get()->map(function ($pass) {
                return [
                    'id' => $pass->id,
                    'pass_number' => 'VP' . strtoupper(substr($pass->id, 0, 8)),
                    'visitor_name' => $pass->visitor_name,
                    'visitor_phone' => $pass->visitor_phone,
                    'visitor_company' => $pass->visitor_company,
                    'purpose' => $pass->purpose,
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
            Log::error('Error fetching visitor gate passes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch visitor gate passes',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

