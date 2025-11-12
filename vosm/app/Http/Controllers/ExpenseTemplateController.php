<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Expense Template Controller
 * 
 * Provides expense template references for quick expense creation.
 * Returns saved expense templates for reuse.
 */
class ExpenseTemplateController extends Controller
{
    /**
     * List all expense templates
     * GET /v1/expense-templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if expense_templates table exists
            if (!DB::getSchemaBuilder()->hasTable('expense_templates')) {
                // Return empty array if table doesn't exist
                return response()->json([]);
            }

            $templates = DB::table('expense_templates')
                ->where('is_active', true)
                ->orWhereNull('is_active')
                ->select('id', 'name', 'category', 'amount', 'description', 'payment_method', 'project_id', 'asset_id')
                ->orderBy('name')
                ->get()
                ->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name ?? 'Unnamed Template',
                        'category' => $template->category ?? 'MISC',
                        'amount' => $template->amount ? (float) $template->amount : null,
                        'description' => $template->description ?? null,
                        'payment_method' => $template->payment_method ?? null,
                        'project_id' => $template->project_id ?? null,
                        'asset_id' => $template->asset_id ?? null,
                    ];
                });

            return response()->json($templates);
        } catch (\Exception $e) {
            Log::warning('Failed to fetch expense templates: ' . $e->getMessage());
            // Return empty array on error (graceful degradation)
            return response()->json([]);
        }
    }

    /**
     * Get a single expense template
     * GET /v1/expense-templates/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('expense_templates')) {
                return response()->json(['error' => 'Template not found'], 404);
            }

            $template = DB::table('expense_templates')->where('id', $id)->first();

            if (!$template) {
                return response()->json(['error' => 'Template not found'], 404);
            }

            return response()->json([
                'id' => $template->id,
                'name' => $template->name ?? 'Unnamed Template',
                'category' => $template->category ?? 'MISC',
                'amount' => $template->amount ? (float) $template->amount : null,
                'description' => $template->description ?? null,
                'payment_method' => $template->payment_method ?? null,
                'project_id' => $template->project_id ?? null,
                'asset_id' => $template->asset_id ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch expense template: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch template'], 500);
        }
    }
}

