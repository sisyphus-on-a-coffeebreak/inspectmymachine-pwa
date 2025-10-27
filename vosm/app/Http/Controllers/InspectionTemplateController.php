<?php

namespace App\Http\Controllers;

use App\Models\InspectionTemplate;
use App\Models\InspectionSection;
use App\Models\InspectionQuestion;
use App\Models\InspectionQuestionOption;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class InspectionTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = InspectionTemplate::with(['sections.questions.options'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($templates);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => ['required', Rule::in(['commercial_vehicle', 'light_vehicle', 'equipment', 'safety', 'custom'])],
            'sections' => 'required|array|min:1',
            'sections.*.name' => 'required|string|max:255',
            'sections.*.description' => 'nullable|string',
            'sections.*.order_index' => 'required|integer|min:0',
            'sections.*.is_required' => 'boolean',
            'sections.*.questions' => 'required|array|min:1',
            'sections.*.questions.*.question_text' => 'required|string',
            'sections.*.questions.*.question_type' => ['required', Rule::in([
                'text', 'number', 'date', 'yesno', 'dropdown', 'slider', 
                'camera', 'audio', 'signature', 'multiselect', 'geolocation'
            ])],
            'sections.*.questions.*.is_required' => 'boolean',
            'sections.*.questions.*.is_critical' => 'boolean',
            'sections.*.questions.*.order_index' => 'required|integer|min:0',
            'sections.*.questions.*.validation_rules' => 'nullable|array',
            'sections.*.questions.*.conditional_logic' => 'nullable|array',
            'sections.*.questions.*.help_text' => 'nullable|string',
            'sections.*.questions.*.options' => 'nullable|array',
            'sections.*.questions.*.options.*.option_text' => 'required_with:sections.*.questions.*.options|string',
            'sections.*.questions.*.options.*.option_value' => 'required_with:sections.*.questions.*.options|string',
            'sections.*.questions.*.options.*.order_index' => 'required_with:sections.*.questions.*.options|integer|min:0',
            'sections.*.questions.*.options.*.is_default' => 'boolean'
        ]);

        $template = InspectionTemplate::create([
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'created_by' => auth()->id()
        ]);

        foreach ($request->sections as $sectionData) {
            $section = $template->sections()->create([
                'name' => $sectionData['name'],
                'description' => $sectionData['description'] ?? null,
                'order_index' => $sectionData['order_index'],
                'is_required' => $sectionData['is_required'] ?? true
            ]);

            foreach ($sectionData['questions'] as $questionData) {
                $question = $section->questions()->create([
                    'question_text' => $questionData['question_text'],
                    'question_type' => $questionData['question_type'],
                    'is_required' => $questionData['is_required'] ?? false,
                    'is_critical' => $questionData['is_critical'] ?? false,
                    'order_index' => $questionData['order_index'],
                    'validation_rules' => $questionData['validation_rules'] ?? null,
                    'conditional_logic' => $questionData['conditional_logic'] ?? null,
                    'help_text' => $questionData['help_text'] ?? null
                ]);

                if (isset($questionData['options']) && is_array($questionData['options'])) {
                    foreach ($questionData['options'] as $optionData) {
                        $question->options()->create([
                            'option_text' => $optionData['option_text'],
                            'option_value' => $optionData['option_value'],
                            'order_index' => $optionData['order_index'],
                            'is_default' => $optionData['is_default'] ?? false
                        ]);
                    }
                }
            }
        }

        return response()->json($template->load(['sections.questions.options']), 201);
    }

    public function show(string $id): JsonResponse
    {
        $template = InspectionTemplate::with(['sections.questions.options'])
            ->findOrFail($id);

        return response()->json($template);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $template = InspectionTemplate::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => ['sometimes', 'required', Rule::in(['commercial_vehicle', 'light_vehicle', 'equipment', 'safety', 'custom'])],
            'is_active' => 'boolean'
        ]);

        $template->update($request->only(['name', 'description', 'category', 'is_active']));

        return response()->json($template->load(['sections.questions.options']));
    }

    public function destroy(string $id): JsonResponse
    {
        $template = InspectionTemplate::findOrFail($id);
        
        // Soft delete by deactivating
        $template->update(['is_active' => false]);

        return response()->json(['message' => 'Template deactivated successfully']);
    }

    public function duplicate(string $id): JsonResponse
    {
        $original = InspectionTemplate::with(['sections.questions.options'])->findOrFail($id);
        
        $newTemplate = $original->replicate();
        $newTemplate->name = $original->name . ' (Copy)';
        $newTemplate->version = 1;
        $newTemplate->created_by = auth()->id();
        $newTemplate->save();

        foreach ($original->sections as $section) {
            $newSection = $newTemplate->sections()->create($section->toArray());
            
            foreach ($section->questions as $question) {
                $newQuestion = $newSection->questions()->create($question->toArray());
                
                foreach ($question->options as $option) {
                    $newQuestion->options()->create($option->toArray());
                }
            }
        }

        return response()->json($newTemplate->load(['sections.questions.options']));
    }
}

