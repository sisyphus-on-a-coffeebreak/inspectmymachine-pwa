<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\InspectionTemplate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InspectionAutoCreateService
{
    /**
     * Auto-create inspection for vehicle entry pass
     * 
     * @param string $vehicleId
     * @param string $inspectorId
     * @return Inspection|null
     */
    public function createInspectionForVehicleEntry(string $vehicleId, string $inspectorId): ?Inspection
    {
        try {
            // Check if inspection already exists for this vehicle today
            $today = Carbon::today();
            $existingInspection = Inspection::where('vehicle_id', $vehicleId)
                ->whereDate('created_at', $today)
                ->whereIn('status', ['draft', 'in_progress'])
                ->first();

            if ($existingInspection) {
                Log::info('Inspection already exists for vehicle today', [
                    'vehicle_id' => $vehicleId,
                    'inspection_id' => $existingInspection->id
                ]);
                return $existingInspection;
            }

            // Find appropriate inspection template
            // Try to find a template for commercial vehicles first, then fallback to any active template
            $template = InspectionTemplate::where('is_active', true)
                ->where(function ($query) {
                    $query->where('category', 'commercial_vehicle')
                          ->orWhere('category', 'light_vehicle');
                })
                ->orderBy('created_at', 'desc')
                ->first();

            // If no vehicle-specific template, get any active template
            if (!$template) {
                $template = InspectionTemplate::where('is_active', true)
                    ->orderBy('created_at', 'desc')
                    ->first();
            }

            if (!$template) {
                Log::warning('No active inspection template found for auto-creation', [
                    'vehicle_id' => $vehicleId
                ]);
                return null;
            }

            // Create draft inspection
            $inspection = Inspection::create([
                'template_id' => $template->id,
                'vehicle_id' => $vehicleId,
                'inspector_id' => $inspectorId,
                'status' => 'draft',
                'started_at' => now(),
            ]);

            Log::info('Inspection auto-created from vehicle entry', [
                'inspection_id' => $inspection->id,
                'vehicle_id' => $vehicleId,
                'template_id' => $template->id,
                'inspector_id' => $inspectorId
            ]);

            return $inspection;
        } catch (\Exception $e) {
            Log::error('Error auto-creating inspection: ' . $e->getMessage(), [
                'vehicle_id' => $vehicleId,
                'inspector_id' => $inspectorId
            ]);
            return null;
        }
    }
}


