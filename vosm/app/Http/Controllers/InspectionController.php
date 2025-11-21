<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionTemplate;
use App\Models\Vehicle;
use App\Models\ComponentMaintenance;
use App\Models\Battery;
use App\Models\Tyre;
use App\Models\SparePart;
use App\Services\QRCodeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class InspectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Inspection::with(['template', 'vehicle', 'inspector', 'reviewer']);
        
        // Filters
        if ($request->status) {
            $query->where('status', $request->status);
        }
        
        if ($request->inspector_id) {
            $query->where('inspector_id', $request->inspector_id);
        }
        
        if ($request->vehicle_id) {
            $query->where('vehicle_id', $request->vehicle_id);
        }
        
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has_critical_issues) {
            $query->where('has_critical_issues', $request->has_critical_issues);
        }

        $inspections = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($inspections);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'template_id' => 'required|exists:inspection_templates,id',
            'vehicle_id' => 'required|exists:vehicles,id'
        ]);

        $inspection = Inspection::create([
            'template_id' => $request->template_id,
            'vehicle_id' => $request->vehicle_id,
            'inspector_id' => auth()->id(),
            'status' => 'draft',
            'started_at' => now()
        ]);

        return response()->json($inspection->load(['template', 'vehicle', 'inspector']), 201);
    }

    public function show(string $id): JsonResponse
    {
        $inspection = Inspection::with([
            'template.sections.questions.options',
            'vehicle',
            'inspector',
            'reviewer',
            'answers.question',
            'rtoDetails.addedBy',
            'rtoDetails.verifiedBy',
            'defaultReportLayout'
        ])->findOrFail($id);

        // Get linked components from inspection answers
        $linkedComponents = DB::table('inspection_answers')
            ->where('inspection_id', $id)
            ->whereNotNull('component_type')
            ->whereNotNull('component_id')
            ->select('component_type', 'component_id')
            ->distinct()
            ->get()
            ->map(function($answer) {
                $component = null;
                $componentName = 'Unknown Component';
                
                try {
                    $component = match($answer->component_type) {
                        'battery' => Battery::find($answer->component_id),
                        'tyre' => Tyre::find($answer->component_id),
                        'spare_part' => SparePart::find($answer->component_id),
                        default => null
                    };
                    
                    if ($component) {
                        if ($answer->component_type === 'spare_part') {
                            $componentName = $component->name ?? 'Spare Part';
                        } else {
                            $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                            if (empty($componentName)) {
                                $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to load component for inspection: ' . $e->getMessage());
                }
                
                return [
                    'component_type' => $answer->component_type,
                    'component_id' => $answer->component_id,
                    'component_name' => $componentName,
                ];
            })
            ->filter(fn($item) => $item['component_id'] !== null)
            ->values();

        // Get linked gate pass (if created from this inspection)
        $linkedGatePass = null;
        if ($inspection->vehicle_id) {
            $gatePass = DB::table('vehicle_exit_passes')
                ->where('vehicle_id', $inspection->vehicle_id)
                ->where('notes', 'like', "%inspection #{$id}%")
                ->whereDate('created_at', $inspection->completed_at ? $inspection->completed_at->format('Y-m-d') : now()->format('Y-m-d'))
                ->first();
            
            if ($gatePass) {
                $linkedGatePass = [
                    'id' => $gatePass->id,
                    'pass_number' => 'VX' . strtoupper(substr($gatePass->id, 0, 8)),
                    'status' => $gatePass->status,
                    'purpose' => $gatePass->purpose,
                ];
            }
        }

        $inspectionData = $inspection->toArray();
        $inspectionData['linked_components'] = $linkedComponents;
        $inspectionData['linked_gate_pass'] = $linkedGatePass;

        return response()->json($inspectionData);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        
        $request->validate([
            'status' => ['sometimes', Rule::in(['draft', 'in_progress', 'completed', 'under_review', 'approved', 'rejected', 'archived'])],
            'overall_rating' => 'nullable|numeric|min:1|max:10',
            'pass_fail' => ['nullable', Rule::in(['pass', 'fail', 'conditional'])],
            'has_critical_issues' => 'boolean',
            'inspector_notes' => 'nullable|string',
            'reviewer_notes' => 'nullable|string',
            'template_id' => 'nullable|exists:inspection_templates,id',
            'template_version_resolution' => ['nullable', Rule::in(['keep_answers', 'use_new_template', 'merge'])],
            'answers' => 'nullable|array',
            'answers.*.question_id' => 'required|exists:inspection_questions,id',
            'answers.*.answer_value' => 'nullable|string',
            'answers.*.answer_files' => 'nullable|array',
            'answers.*.answer_metadata' => 'nullable|array',
            'answers.*.is_critical_finding' => 'boolean'
        ]);

        // Handle template version resolution
        if ($request->template_id && $request->template_version_resolution) {
            $newTemplate = InspectionTemplate::findOrFail($request->template_id);
            $oldTemplate = $inspection->template;
            
            // Update template reference
            $inspection->update(['template_id' => $newTemplate->id]);
            
            // Handle resolution strategy
            if ($request->template_version_resolution === 'use_new_template') {
                // Clear all answers
                $inspection->answers()->delete();
            } elseif ($request->template_version_resolution === 'merge') {
                // Remove answers for questions that no longer exist or were modified
                $newQuestionIds = $newTemplate->sections()
                    ->with('questions')
                    ->get()
                    ->pluck('questions')
                    ->flatten()
                    ->pluck('id')
                    ->toArray();
                
                $inspection->answers()
                    ->whereNotIn('question_id', $newQuestionIds)
                    ->delete();
            }
            // 'keep_answers' - do nothing, keep all existing answers
        }
        
        $inspection->update($request->only([
            'status', 'overall_rating', 'pass_fail', 'has_critical_issues',
            'inspector_notes', 'reviewer_notes'
        ]));

        // Update answers
        if ($request->answers) {
            foreach ($request->answers as $answerData) {
                $inspection->answers()->updateOrCreate(
                    ['question_id' => $answerData['question_id']],
                    $answerData
                );
            }
        }

        // Update completion time if status changed to completed
        if ($request->status === 'completed' && !$inspection->completed_at) {
            DB::beginTransaction();
            
            try {
                $inspection->update([
                    'completed_at' => now(),
                    'duration_minutes' => $inspection->started_at ? 
                        $inspection->started_at->diffInMinutes(now()) : null
                ]);
                
                // Link inspection answers to components and create maintenance records
                $this->linkInspectionToComponents($inspection);
                
                // Auto-create gate pass if inspection indicates vehicle needs to leave
                try {
                    $this->createGatePassFromInspection($inspection, $request->user());
                } catch (\Exception $e) {
                    Log::warning('Failed to create gate pass from inspection: ' . $e->getMessage());
                    // Don't fail the update, just log the error
                }
                
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to link inspection to components: ' . $e->getMessage());
                // Don't fail the update, just log the error
            }
        }

        return response()->json($inspection->load(['answers.question']));
    }

    public function destroy(string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        
        // Only allow deletion of draft inspections
        if ($inspection->status !== 'draft') {
            return response()->json(['error' => 'Only draft inspections can be deleted'], 422);
        }

        $inspection->delete();

        return response()->json(['message' => 'Inspection deleted successfully']);
    }

    public function submit(string $id): JsonResponse
    {
        $inspection = Inspection::with(['template.sections.questions'])->findOrFail($id);
        
        // Validate all required questions are answered
        $requiredQuestions = $inspection->template->sections()
            ->with('questions')
            ->get()
            ->pluck('questions')
            ->flatten()
            ->where('is_required', true);

        $answeredQuestions = $inspection->answers()->pluck('question_id');
        $missingRequired = $requiredQuestions->whereNotIn('id', $answeredQuestions);

        if ($missingRequired->count() > 0) {
            return response()->json([
                'error' => 'Missing required questions',
                'missing' => $missingRequired->pluck('question_text')->values()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            $inspection->update([
                'status' => 'completed',
                'completed_at' => now(),
                'duration_minutes' => $inspection->started_at ? 
                    $inspection->started_at->diffInMinutes(now()) : null
            ]);

            // Link inspection answers to components and create maintenance records
            $this->linkInspectionToComponents($inspection);
            
            // Auto-create gate pass if inspection indicates vehicle needs to leave
            $this->createGatePassFromInspection($inspection, $request->user());
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to link inspection to components: ' . $e->getMessage());
            // Don't fail the inspection submission, just log the error
        }

        return response()->json($inspection->load(['answers.question']));
    }

    /**
     * Link inspection answers to components and create maintenance records
     */
    protected function linkInspectionToComponents(Inspection $inspection): void
    {
        $answers = $inspection->answers()->with('question')->get();
        $vehicle = $inspection->vehicle;
        
        if (!$vehicle) {
            return;
        }
        
        foreach ($answers as $answer) {
            $question = $answer->question;
            if (!$question) {
                continue;
            }
            
            $questionText = strtolower($question->question_text ?? '');
            $answerValue = $answer->answer_value;
            
            // Detect component-related questions and link them
            $component = null;
            $componentType = null;
            
            // Battery voltage questions
            if (strpos($questionText, 'battery') !== false && strpos($questionText, 'voltage') !== false) {
                $batteries = Battery::where('current_vehicle_id', $vehicle->id)->get();
                if ($batteries->count() === 1) {
                    $component = $batteries->first();
                    $componentType = 'battery';
                }
            }
            
            // Tyre tread depth questions
            if (strpos($questionText, 'tyre') !== false && (strpos($questionText, 'tread') !== false || strpos($questionText, 'depth') !== false)) {
                // Try to match by position if mentioned in question
                $position = null;
                if (strpos($questionText, 'front left') !== false || strpos($questionText, 'fl') !== false) {
                    $position = 'front_left';
                } elseif (strpos($questionText, 'front right') !== false || strpos($questionText, 'fr') !== false) {
                    $position = 'front_right';
                } elseif (strpos($questionText, 'rear left') !== false || strpos($questionText, 'rl') !== false) {
                    $position = 'rear_left';
                } elseif (strpos($questionText, 'rear right') !== false || strpos($questionText, 'rr') !== false) {
                    $position = 'rear_right';
                } elseif (strpos($questionText, 'spare') !== false) {
                    $position = 'spare';
                }
                
                $tyreQuery = Tyre::where('current_vehicle_id', $vehicle->id);
                if ($position) {
                    $tyreQuery->where('position', $position);
                }
                $tyres = $tyreQuery->get();
                
                if ($tyres->count() === 1) {
                    $component = $tyres->first();
                    $componentType = 'tyre';
                }
            }
            
            // Update answer with component link if found
            if ($component && $componentType) {
                $answer->update([
                    'component_type' => $componentType,
                    'component_id' => $component->id,
                ]);
                
                // Create maintenance record for component measurements
                $this->createMaintenanceFromInspection($component, $componentType, $inspection, $question, $answerValue);
            }
        }
    }

    /**
     * Create maintenance record from inspection answer
     */
    protected function createMaintenanceFromInspection($component, string $componentType, Inspection $inspection, $question, $answerValue): void
    {
        $questionText = strtolower($question->question_text ?? '');
        $maintenanceType = 'inspection';
        $title = 'Inspection Measurement';
        $description = "Measured during inspection #{$inspection->id}: {$question->question_text} = {$answerValue}";
        
        // Determine maintenance type and title based on question
        if (strpos($questionText, 'voltage') !== false) {
            $title = 'Battery Voltage Check';
            $description = "Battery voltage measured: {$answerValue}V during inspection #{$inspection->id}";
        } elseif (strpos($questionText, 'tread') !== false || strpos($questionText, 'depth') !== false) {
            $title = 'Tyre Tread Depth Measurement';
            $treadDepth = is_numeric($answerValue) ? floatval($answerValue) : null;
            $description = "Tyre tread depth measured: {$answerValue}mm during inspection #{$inspection->id}";
            
            // Update tyre tread depth if numeric value
            if ($treadDepth !== null && $componentType === 'tyre') {
                $component->update(['tread_depth_mm' => $treadDepth]);
            }
        }
        
        // Check if maintenance record already exists for this inspection
        $existingMaintenance = ComponentMaintenance::where('component_type', $componentType)
            ->where('component_id', $component->id)
            ->where('maintenance_type', 'inspection')
            ->where('description', 'like', "%inspection #{$inspection->id}%")
            ->first();
        
        if (!$existingMaintenance) {
            ComponentMaintenance::create([
                'component_type' => $componentType,
                'component_id' => $component->id,
                'maintenance_type' => $maintenanceType,
                'title' => $title,
                'description' => $description,
                'performed_at' => $inspection->completed_at ?? now(),
                'performed_by' => $inspection->inspector_id,
                'notes' => "Auto-created from inspection #{$inspection->id}",
            ]);
        }
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        
        $request->validate([
            'reviewer_notes' => 'nullable|string'
        ]);

        $inspection->update([
            'status' => 'approved',
            'reviewer_id' => auth()->id(),
            'reviewed_at' => now(),
            'reviewer_notes' => $request->reviewer_notes
        ]);

        // Auto-create gate pass if inspection indicates vehicle needs to leave
        try {
            $this->createGatePassFromInspection($inspection, $request->user());
        } catch (\Exception $e) {
            Log::warning('Failed to create gate pass from inspection approval: ' . $e->getMessage());
            // Don't fail the approval, just log the error
        }

        return response()->json($inspection->load(['reviewer']));
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        
        $request->validate([
            'reviewer_notes' => 'required|string'
        ]);

        $inspection->update([
            'status' => 'rejected',
            'reviewer_id' => auth()->id(),
            'reviewed_at' => now(),
            'reviewer_notes' => $request->reviewer_notes
        ]);

        return response()->json($inspection->load(['reviewer']));
    }

    /**
     * Reorder photos in an inspection answer
     * 
     * @param Request $request
     * @param string $inspectionId
     * @param string $answerId
     * @return JsonResponse
     */
    public function reorderPhotos(Request $request, string $inspectionId, string $answerId): JsonResponse
    {
        $request->validate([
            'photo_keys' => 'required|array',
            'photo_keys.*' => 'required|string'
        ]);

        $inspection = Inspection::findOrFail($inspectionId);
        
        // Find the answer and ensure it belongs to this inspection
        $answer = $inspection->answers()->findOrFail($answerId);
        
        $currentFiles = $answer->answer_files ?? [];
        
        if (empty($currentFiles)) {
            return response()->json([
                'error' => 'No photos found in this answer'
            ], 422);
        }

        $photoKeys = $request->input('photo_keys', []);
        
        // Validate that all provided keys exist in the current files
        $currentKeys = collect($currentFiles)->pluck('key')->filter()->toArray();
        $missingKeys = array_diff($photoKeys, $currentKeys);
        
        if (!empty($missingKeys)) {
            return response()->json([
                'error' => 'Some photo keys do not exist in this answer',
                'missing_keys' => array_values($missingKeys)
            ], 422);
        }

        // Validate that all current keys are included in the new order
        $extraKeys = array_diff($currentKeys, $photoKeys);
        if (!empty($extraKeys)) {
            return response()->json([
                'error' => 'All existing photos must be included in the new order',
                'missing_keys' => array_values($extraKeys)
            ], 422);
        }

        // Create a map of files by key for quick lookup
        $filesMap = collect($currentFiles)->keyBy(function($file) {
            return $file['key'] ?? null;
        })->filter();

        // Reorder files based on the new order
        $reorderedFiles = [];
        foreach ($photoKeys as $key) {
            if (isset($filesMap[$key])) {
                $reorderedFiles[] = $filesMap[$key];
            }
        }

        // Update the answer with reordered files
        $answer->update(['answer_files' => $reorderedFiles]);

        return response()->json([
            'message' => 'Photos reordered successfully',
            'answer' => $answer->fresh(['question'])
        ]);
    }

    /**
     * Create gate pass from inspection if vehicle needs to leave
     */
    protected function createGatePassFromInspection(Inspection $inspection, $user): ?string
    {
        // Only create gate pass if inspection is completed/approved and has critical issues or needs service
        if (!$inspection->vehicle_id) {
            return null;
        }

        // Check if inspection indicates vehicle needs to leave (for service, repairs, etc.)
        $needsGatePass = false;
        $purpose = 'service'; // Default purpose
        
        // Check for critical issues
        if ($inspection->has_critical_issues) {
            $needsGatePass = true;
            $purpose = 'service';
        }
        
        // Check inspector notes for keywords indicating vehicle needs to leave
        $inspectorNotes = strtolower($inspection->inspector_notes ?? '');
        if (strpos($inspectorNotes, 'service') !== false || 
            strpos($inspectorNotes, 'repair') !== false ||
            strpos($inspectorNotes, 'maintenance') !== false ||
            strpos($inspectorNotes, 'workshop') !== false) {
            $needsGatePass = true;
            $purpose = 'service';
        }
        
        // Check reviewer notes
        $reviewerNotes = strtolower($inspection->reviewer_notes ?? '');
        if (strpos($reviewerNotes, 'service') !== false || 
            strpos($reviewerNotes, 'repair') !== false ||
            strpos($reviewerNotes, 'maintenance') !== false ||
            strpos($reviewerNotes, 'workshop') !== false) {
            $needsGatePass = true;
            $purpose = 'service';
        }
        
        // Check pass_fail status
        if ($inspection->pass_fail === 'fail') {
            $needsGatePass = true;
            $purpose = 'service';
        }
        
        if (!$needsGatePass) {
            return null;
        }
        
        // Check if gate pass already exists for this vehicle today
        $today = now()->format('Y-m-d');
        $existingPass = DB::table('vehicle_exit_passes')
            ->where('vehicle_id', $inspection->vehicle_id)
            ->where('notes', 'like', "%inspection #{$inspection->id}%")
            ->whereDate('created_at', $today)
            ->first();
        
        if ($existingPass) {
            Log::info('Gate pass already exists for vehicle from this inspection', [
                'vehicle_id' => $inspection->vehicle_id,
                'pass_id' => $existingPass->id,
                'inspection_id' => $inspection->id
            ]);
            return $existingPass->id;
        }
        
        try {
            $qrCodeService = app(QRCodeService::class);
            $passId = (string) Str::uuid();
            $accessCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $qrData = $qrCodeService->generatePayload($passId, 'vehicle_exit');
            
            DB::table('vehicle_exit_passes')->insert([
                'id' => $passId,
                'vehicle_id' => $inspection->vehicle_id,
                'purpose' => $purpose,
                'driver_name' => null,
                'driver_contact' => null,
                'driver_license_number' => null,
                'expected_return_date' => null,
                'expected_return_time' => null,
                'destination' => null,
                'valid_from' => $today,
                'valid_to' => $today,
                'access_code' => $accessCode,
                'qr_payload' => $qrData['qr_payload'],
                'qr_token' => $qrData['qr_token'],
                'qr_expires_at' => $qrData['qr_expires_at'],
                'status' => 'pending',
                'requires_approval' => false,
                'approval_status' => 'not_required',
                'notes' => "Auto-created from inspection #{$inspection->id}. " . 
                          ($inspection->has_critical_issues ? 'Critical issues found. ' : '') .
                          ($inspection->inspector_notes ? substr($inspection->inspector_notes, 0, 200) : ''),
                'created_by' => $user->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            Log::info('Gate pass created from inspection', [
                'inspection_id' => $inspection->id,
                'pass_id' => $passId,
                'vehicle_id' => $inspection->vehicle_id,
                'purpose' => $purpose
            ]);
            
            return $passId;
        } catch (\Exception $e) {
            Log::error('Failed to create gate pass from inspection: ' . $e->getMessage(), [
                'inspection_id' => $inspection->id,
                'vehicle_id' => $inspection->vehicle_id
            ]);
            throw $e;
        }
    }
}

