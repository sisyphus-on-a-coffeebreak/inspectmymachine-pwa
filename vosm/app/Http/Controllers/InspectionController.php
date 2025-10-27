<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionTemplate;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

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
            'answers.question'
        ])->findOrFail($id);

        return response()->json($inspection);
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
            'answers' => 'nullable|array',
            'answers.*.question_id' => 'required|exists:inspection_questions,id',
            'answers.*.answer_value' => 'nullable|string',
            'answers.*.answer_files' => 'nullable|array',
            'answers.*.answer_metadata' => 'nullable|array',
            'answers.*.is_critical_finding' => 'boolean'
        ]);

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
            $inspection->update([
                'completed_at' => now(),
                'duration_minutes' => $inspection->started_at ? 
                    $inspection->started_at->diffInMinutes(now()) : null
            ]);
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

        $inspection->update([
            'status' => 'completed',
            'completed_at' => now(),
            'duration_minutes' => $inspection->started_at ? 
                $inspection->started_at->diffInMinutes(now()) : null
        ]);

        return response()->json($inspection->load(['answers.question']));
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
}

