<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionReportLayout;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class InspectionReportLayoutController extends Controller
{
    /**
     * Get report layout for an inspection
     */
    public function show(string $inspectionId, ?string $layoutId = null): JsonResponse
    {
        $inspection = Inspection::findOrFail($inspectionId);
        
        if ($layoutId) {
            $layout = InspectionReportLayout::where('id', $layoutId)
                ->where('inspection_id', $inspectionId)
                ->with('createdBy')
                ->firstOrFail();
        } else {
            // Get default layout or create one
            $layout = $inspection->defaultReportLayout()->with('createdBy')->first();
            
            if (!$layout) {
                // Create default layout
                $layout = $this->createDefaultLayout($inspection);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $layout,
        ]);
    }

    /**
     * Save report layout
     */
    public function store(Request $request, string $inspectionId): JsonResponse
    {
        $inspection = Inspection::findOrFail($inspectionId);
        
        $request->validate([
            'layout_config' => 'required|array',
            'section_order' => 'required|array',
            'visible_sections' => 'required|array',
            'report_title' => 'nullable|string|max:255',
            'report_footer' => 'nullable|string',
            'include_company_logo' => 'boolean',
            'include_signatures' => 'boolean',
            'include_photos' => 'boolean',
            'is_default' => 'boolean',
        ]);

        try {
            // If this is set as default, unset other defaults
            if ($request->input('is_default', false)) {
                InspectionReportLayout::where('inspection_id', $inspectionId)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            $layout = InspectionReportLayout::updateOrCreate(
                [
                    'inspection_id' => $inspectionId,
                    'is_default' => $request->input('is_default', false),
                ],
                array_merge($request->all(), [
                    'created_by' => auth()->id(),
                ])
            );

            Log::info('Report layout saved', [
                'inspection_id' => $inspectionId,
                'layout_id' => $layout->id,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report layout saved successfully',
                'data' => $layout->load('createdBy'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save report layout: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save report layout',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create default layout for inspection
     */
    private function createDefaultLayout(Inspection $inspection): InspectionReportLayout
    {
        $defaultLayout = [
            'sections' => [
                ['id' => 'header', 'type' => 'header', 'order' => 0],
                ['id' => 'vehicle_info', 'type' => 'vehicle_info', 'order' => 1],
                ['id' => 'rto_details', 'type' => 'rto_details', 'order' => 2],
                ['id' => 'inspection_results', 'type' => 'inspection_results', 'order' => 3],
                ['id' => 'critical_findings', 'type' => 'critical_findings', 'order' => 4],
                ['id' => 'answers', 'type' => 'answers', 'order' => 5],
                ['id' => 'photos', 'type' => 'photos', 'order' => 6],
                ['id' => 'signatures', 'type' => 'signatures', 'order' => 7],
                ['id' => 'footer', 'type' => 'footer', 'order' => 8],
            ],
        ];

        return InspectionReportLayout::create([
            'inspection_id' => $inspection->id,
            'created_by' => auth()->id() ?? $inspection->inspector_id,
            'layout_config' => $defaultLayout,
            'section_order' => array_column($defaultLayout['sections'], 'id'),
            'visible_sections' => array_fill_keys(array_column($defaultLayout['sections'], 'id'), true),
            'is_default' => true,
        ]);
    }
}

