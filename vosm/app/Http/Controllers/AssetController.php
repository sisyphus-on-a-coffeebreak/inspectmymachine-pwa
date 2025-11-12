<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Asset Controller
 * 
 * Provides asset/vehicle references for expense linking.
 * Returns vehicles and equipment for expense forms.
 */
class AssetController extends Controller
{
    /**
     * List all active assets/vehicles
     * GET /v1/assets
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $assets = [];

            // Fetch vehicles if table exists
            if (DB::getSchemaBuilder()->hasTable('vehicles')) {
                $vehicles = DB::table('vehicles')
                    ->select('id', 'registration_number', 'make', 'model', 'year', 'vehicle_type')
                    ->orderBy('registration_number')
                    ->get()
                    ->map(function ($vehicle) {
                        $name = trim(($vehicle->make ?? '') . ' ' . ($vehicle->model ?? '') . ' ' . ($vehicle->year ?? ''));
                        if (empty($name)) {
                            $name = 'Vehicle ' . substr($vehicle->id, 0, 8);
                        }
                        return [
                            'id' => $vehicle->id,
                            'name' => $name,
                            'type' => $vehicle->vehicle_type ?? 'vehicle',
                            'registration_number' => $vehicle->registration_number ?? null,
                            'status' => 'active',
                        ];
                    });

                $assets = array_merge($assets, $vehicles->toArray());
            }

            // Could add equipment/assets table here in the future
            // if (DB::getSchemaBuilder()->hasTable('equipment')) { ... }

            return response()->json($assets);
        } catch (\Exception $e) {
            Log::warning('Failed to fetch assets: ' . $e->getMessage());
            // Return empty array on error (graceful degradation)
            return response()->json([]);
        }
    }

    /**
     * Get a single asset
     * GET /v1/assets/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Check vehicles first
            if (DB::getSchemaBuilder()->hasTable('vehicles')) {
                $vehicle = DB::table('vehicles')->where('id', $id)->first();
                if ($vehicle) {
                    $name = trim(($vehicle->make ?? '') . ' ' . ($vehicle->model ?? '') . ' ' . ($vehicle->year ?? ''));
                    if (empty($name)) {
                        $name = 'Vehicle ' . substr($vehicle->id, 0, 8);
                    }
                    return response()->json([
                        'id' => $vehicle->id,
                        'name' => $name,
                        'type' => $vehicle->vehicle_type ?? 'vehicle',
                        'registration_number' => $vehicle->registration_number ?? null,
                        'status' => 'active',
                    ]);
                }
            }

            return response()->json(['error' => 'Asset not found'], 404);
        } catch (\Exception $e) {
            Log::error('Failed to fetch asset: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch asset'], 500);
        }
    }
}

