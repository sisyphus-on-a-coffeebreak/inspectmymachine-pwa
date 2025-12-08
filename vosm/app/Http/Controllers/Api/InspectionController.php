<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InspectionController extends Controller
{
    /**
     * List inspections with pagination
     * 
     * GET /api/v1/inspections
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->input('per_page', 20);
            $page = (int) $request->input('page', 1);
            
            // Validate pagination parameters
            $perPage = max(1, min(100, $perPage)); // Between 1 and 100
            $page = max(1, $page);
            
            // Check if inspections table exists
            if (!DB::getSchemaBuilder()->hasTable('inspections')) {
                return response()->json([
                    'data' => [],
                    'meta' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                    ]
                ], 200);
            }
            
            // Build query
            $query = DB::table('inspections');
            
            // Apply filters if needed
            if ($request->has('vehicle_id')) {
                $query->where('vehicle_id', $request->input('vehicle_id'));
            }
            
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }
            
            // Get total count
            $total = $query->count();
            
            // Get paginated results
            $inspections = $query
                ->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();
            
            // Calculate last page
            $lastPage = max(1, (int) ceil($total / $perPage));
            
            return response()->json([
                'data' => $inspections,
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching inspections: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'message' => 'Error fetching inspections',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get a single inspection
     * 
     * GET /api/v1/inspections/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('inspections')) {
                return response()->json([
                    'message' => 'Inspection not found'
                ], 404);
            }
            
            $inspection = DB::table('inspections')->where('id', $id)->first();
            
            if (!$inspection) {
                return response()->json([
                    'message' => 'Inspection not found'
                ], 404);
            }
            
            return response()->json($inspection, 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching inspection: ' . $e->getMessage(), [
                'exception' => $e,
                'id' => $id,
            ]);
            
            return response()->json([
                'message' => 'Error fetching inspection',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Create/submit inspection
     * 
     * POST /api/v1/inspections
     * 
     * Accepts multipart/form-data with:
     * - payload: JSON string containing template_id, vehicle_id, status, answers, meta
     * - media[questionId][]: Array of files for media questions
     * - audio[questionId]: Single file for audio questions
     * - signatures[questionId]: Single file for signature questions
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Check if inspections table exists
            if (!DB::getSchemaBuilder()->hasTable('inspections')) {
                return response()->json([
                    'message' => 'Inspections table does not exist'
                ], 500);
            }

            // Validate payload exists
            if (!$request->has('payload')) {
                return response()->json([
                    'message' => 'Payload is required',
                    'errors' => ['payload' => ['The payload field is required.']]
                ], 422);
            }

            // Parse payload JSON
            $payload = json_decode($request->input('payload'), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid payload JSON',
                    'error' => json_last_error_msg()
                ], 422);
            }

            // Validate required fields
            if (empty($payload['template_id'])) {
                return response()->json([
                    'message' => 'Template ID is required',
                    'errors' => ['template_id' => ['The template_id field is required.']]
                ], 422);
            }

            // Get authenticated user
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // Prepare inspection data
            $inspectionData = [
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'template_id' => $payload['template_id'],
                'vehicle_id' => $payload['vehicle_id'] ?? null,
                'status' => $payload['status'] ?? 'completed',
                'created_by' => $user->id,
                'answers' => json_encode($payload['answers'] ?? []),
                'metadata' => json_encode($payload['meta'] ?? []),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Handle file uploads
            $uploadedFiles = [];
            
            // Process media files: media[questionId][]
            foreach ($request->allFiles() as $key => $files) {
                if (str_starts_with($key, 'media[')) {
                    // Extract questionId from key like "media[questionId][]"
                    preg_match('/media\[([^\]]+)\]/', $key, $matches);
                    $questionId = $matches[1] ?? null;
                    
                    if ($questionId) {
                        $fileArray = is_array($files) ? $files : [$files];
                        foreach ($fileArray as $file) {
                            if ($file->isValid()) {
                                // Store file and get path
                                $path = $file->store('inspections/media', 'public');
                                $uploadedFiles[] = [
                                    'question_id' => $questionId,
                                    'type' => 'media',
                                    'path' => $path,
                                    'original_name' => $file->getClientOriginalName(),
                                    'mime_type' => $file->getMimeType(),
                                    'size' => $file->getSize(),
                                ];
                            }
                        }
                    }
                }
                
                // Process audio files: audio[questionId]
                if (str_starts_with($key, 'audio[')) {
                    preg_match('/audio\[([^\]]+)\]/', $key, $matches);
                    $questionId = $matches[1] ?? null;
                    
                    if ($questionId && $files->isValid()) {
                        $path = $files->store('inspections/audio', 'public');
                        $uploadedFiles[] = [
                            'question_id' => $questionId,
                            'type' => 'audio',
                            'path' => $path,
                            'original_name' => $files->getClientOriginalName(),
                            'mime_type' => $files->getMimeType(),
                            'size' => $files->getSize(),
                        ];
                    }
                }
                
                // Process signature files: signatures[questionId]
                if (str_starts_with($key, 'signatures[')) {
                    preg_match('/signatures\[([^\]]+)\]/', $key, $matches);
                    $questionId = $matches[1] ?? null;
                    
                    if ($questionId && $files->isValid()) {
                        $path = $files->store('inspections/signatures', 'public');
                        $uploadedFiles[] = [
                            'question_id' => $questionId,
                            'type' => 'signature',
                            'path' => $path,
                            'original_name' => $files->getClientOriginalName(),
                            'mime_type' => $files->getMimeType(),
                            'size' => $files->getSize(),
                        ];
                    }
                }
            }

            // Store uploaded files info in metadata if needed
            if (!empty($uploadedFiles)) {
                $metadata = json_decode($inspectionData['metadata'], true) ?? [];
                $metadata['uploaded_files'] = $uploadedFiles;
                $inspectionData['metadata'] = json_encode($metadata);
            }

            // Insert inspection record
            DB::table('inspections')->insert($inspectionData);

            // Return created inspection
            $inspection = DB::table('inspections')->where('id', $inspectionData['id'])->first();

            return response()->json([
                'id' => $inspection->id,
                'template_id' => $inspection->template_id,
                'vehicle_id' => $inspection->vehicle_id,
                'status' => $inspection->status,
                'created_at' => $inspection->created_at,
                'updated_at' => $inspection->updated_at,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating inspection: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'request_data' => [
                    'has_payload' => $request->has('payload'),
                    'files_count' => count($request->allFiles()),
                ],
            ]);

            return response()->json([
                'message' => 'Error creating inspection',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get RTO details for an inspection
     * 
     * GET /api/v1/inspections/{inspectionId}/rto-details
     */
    public function getRtoDetails(string $inspectionId): JsonResponse
    {
        try {
            // Check if inspection_rto_details table exists
            if (!DB::getSchemaBuilder()->hasTable('inspection_rto_details')) {
                return response()->json([
                    'success' => false,
                    'message' => 'RTO details not found'
                ], 404);
            }

            // Verify inspection exists
            if (!DB::getSchemaBuilder()->hasTable('inspections')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspection not found'
                ], 404);
            }

            $inspection = DB::table('inspections')->where('id', $inspectionId)->first();
            if (!$inspection) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspection not found'
                ], 404);
            }

            // Get RTO details
            $rtoDetails = DB::table('inspection_rto_details')
                ->where('inspection_id', $inspectionId)
                ->first();

            if (!$rtoDetails) {
                return response()->json([
                    'success' => false,
                    'message' => 'RTO details not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $rtoDetails
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching RTO details: ' . $e->getMessage(), [
                'exception' => $e,
                'inspection_id' => $inspectionId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching RTO details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Save/Update RTO details for an inspection
     * 
     * POST /api/v1/inspections/{inspectionId}/rto-details
     */
    public function saveRtoDetails(Request $request, string $inspectionId): JsonResponse
    {
        try {
            // Verify inspection exists
            if (!DB::getSchemaBuilder()->hasTable('inspections')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspection not found'
                ], 404);
            }

            $inspection = DB::table('inspections')->where('id', $inspectionId)->first();
            if (!$inspection) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspection not found'
                ], 404);
            }

            // Get authenticated user
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // Prepare RTO details data
            $rtoData = [
                'inspection_id' => $inspectionId,
                'rc_number' => $request->input('rc_number'),
                'rc_issue_date' => $request->input('rc_issue_date'),
                'rc_expiry_date' => $request->input('rc_expiry_date'),
                'rc_owner_name' => $request->input('rc_owner_name'),
                'rc_owner_address' => $request->input('rc_owner_address'),
                'fitness_certificate_number' => $request->input('fitness_certificate_number'),
                'fitness_issue_date' => $request->input('fitness_issue_date'),
                'fitness_expiry_date' => $request->input('fitness_expiry_date'),
                'fitness_status' => $request->input('fitness_status'),
                'permit_number' => $request->input('permit_number'),
                'permit_issue_date' => $request->input('permit_issue_date'),
                'permit_expiry_date' => $request->input('permit_expiry_date'),
                'permit_type' => $request->input('permit_type'),
                'insurance_policy_number' => $request->input('insurance_policy_number'),
                'insurance_company' => $request->input('insurance_company'),
                'insurance_issue_date' => $request->input('insurance_issue_date'),
                'insurance_expiry_date' => $request->input('insurance_expiry_date'),
                'insurance_type' => $request->input('insurance_type'),
                'tax_certificate_number' => $request->input('tax_certificate_number'),
                'tax_paid_date' => $request->input('tax_paid_date'),
                'tax_valid_until' => $request->input('tax_valid_until'),
                'puc_certificate_number' => $request->input('puc_certificate_number'),
                'puc_issue_date' => $request->input('puc_issue_date'),
                'puc_expiry_date' => $request->input('puc_expiry_date'),
                'puc_status' => $request->input('puc_status'),
                'show_rc_details' => $request->input('show_rc_details', false),
                'show_fitness' => $request->input('show_fitness', false),
                'show_permit' => $request->input('show_permit', false),
                'show_insurance' => $request->input('show_insurance', false),
                'show_tax' => $request->input('show_tax', false),
                'show_puc' => $request->input('show_puc', false),
                'verification_notes' => $request->input('verification_notes'),
                'discrepancies' => $request->input('discrepancies'),
                'updated_by' => $user->id,
                'updated_at' => now(),
            ];

            // Remove null values
            $rtoData = array_filter($rtoData, function($value) {
                return $value !== null;
            });

            // Check if table exists, if not, create it on the fly (for now, just return error)
            if (!DB::getSchemaBuilder()->hasTable('inspection_rto_details')) {
                return response()->json([
                    'success' => false,
                    'message' => 'RTO details table does not exist. Please run migrations.',
                ], 500);
            }

            // Check if RTO details already exist
            $existing = DB::table('inspection_rto_details')
                ->where('inspection_id', $inspectionId)
                ->first();

            if ($existing) {
                // Update existing record
                $rtoData['updated_at'] = now();
                DB::table('inspection_rto_details')
                    ->where('inspection_id', $inspectionId)
                    ->update($rtoData);
            } else {
                // Create new record
                $rtoData['id'] = \Illuminate\Support\Str::uuid()->toString();
                $rtoData['created_by'] = $user->id;
                $rtoData['created_at'] = now();
                DB::table('inspection_rto_details')->insert($rtoData);
            }

            // Return updated RTO details
            $rtoDetails = DB::table('inspection_rto_details')
                ->where('inspection_id', $inspectionId)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $rtoDetails,
                'message' => 'RTO details saved successfully'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error saving RTO details: ' . $e->getMessage(), [
                'exception' => $e,
                'inspection_id' => $inspectionId,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error saving RTO details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}


