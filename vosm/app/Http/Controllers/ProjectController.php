<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Project Controller
 * 
 * Provides project references for expense linking.
 * Returns simple project list for expense forms.
 */
class ProjectController extends Controller
{
    /**
     * List all active projects
     * GET /v1/projects
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if projects table exists
            if (!DB::getSchemaBuilder()->hasTable('projects')) {
                // Return empty array if table doesn't exist
                return response()->json([]);
            }

            $projects = DB::table('projects')
                ->where('status', 'active')
                ->orWhereNull('status')
                ->select('id', 'name', 'code', 'status')
                ->orderBy('name')
                ->get()
                ->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name ?? 'Unnamed Project',
                        'code' => $project->code ?? null,
                        'status' => $project->status ?? 'active',
                    ];
                });

            return response()->json($projects);
        } catch (\Exception $e) {
            Log::warning('Failed to fetch projects: ' . $e->getMessage());
            // Return empty array on error (graceful degradation)
            return response()->json([]);
        }
    }

    /**
     * Get a single project
     * GET /v1/projects/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('projects')) {
                return response()->json(['error' => 'Project not found'], 404);
            }

            $project = DB::table('projects')->where('id', $id)->first();

            if (!$project) {
                return response()->json(['error' => 'Project not found'], 404);
            }

            return response()->json([
                'id' => $project->id,
                'name' => $project->name ?? 'Unnamed Project',
                'code' => $project->code ?? null,
                'status' => $project->status ?? 'active',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch project: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch project'], 500);
        }
    }
}

