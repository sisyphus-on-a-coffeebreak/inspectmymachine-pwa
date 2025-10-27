<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::with(['owner', 'yard']);
        
        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('registration_number', 'like', "%{$search}%")
                  ->orWhere('chassis_number', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->vehicle_type) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        if ($request->make) {
            $query->where('make', $request->make);
        }

        if ($request->year_from) {
            $query->where('year', '>=', $request->year_from);
        }

        if ($request->year_to) {
            $query->where('year', '<=', $request->year_to);
        }

        $vehicles = $query->orderBy('registration_number')
            ->paginate($request->get('per_page', 20));

        return response()->json($vehicles);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'registration_number' => 'required|string|max:20|unique:vehicles',
            'chassis_number' => 'nullable|string|max:50',
            'engine_number' => 'nullable|string|max:50',
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'vehicle_type' => ['required', Rule::in(['commercial', 'light_vehicle', 'equipment'])],
            'owner_id' => 'nullable|exists:users,id',
            'yard_id' => 'nullable|exists:yards,id'
        ]);

        $vehicle = Vehicle::create($request->all());

        return response()->json($vehicle->load(['owner', 'yard']), 201);
    }

    public function show(string $id): JsonResponse
    {
        $vehicle = Vehicle::with(['owner', 'yard', 'inspections.template'])
            ->findOrFail($id);

        return response()->json($vehicle);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);

        $request->validate([
            'registration_number' => 'sometimes|required|string|max:20|unique:vehicles,registration_number,' . $id,
            'chassis_number' => 'nullable|string|max:50',
            'engine_number' => 'nullable|string|max:50',
            'make' => 'sometimes|required|string|max:100',
            'model' => 'sometimes|required|string|max:100',
            'year' => 'sometimes|required|integer|min:1900|max:' . (date('Y') + 1),
            'vehicle_type' => ['sometimes', 'required', Rule::in(['commercial', 'light_vehicle', 'equipment'])],
            'owner_id' => 'nullable|exists:users,id',
            'yard_id' => 'nullable|exists:yards,id'
        ]);

        $vehicle->update($request->all());

        return response()->json($vehicle->load(['owner', 'yard']));
    }

    public function destroy(string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        
        // Check if vehicle has inspections
        if ($vehicle->inspections()->count() > 0) {
            return response()->json(['error' => 'Cannot delete vehicle with existing inspections'], 422);
        }

        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted successfully']);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $vehicles = Vehicle::where('registration_number', 'like', "%{$request->q}%")
            ->orWhere('chassis_number', 'like', "%{$request->q}%")
            ->orWhere('make', 'like', "%{$request->q}%")
            ->orWhere('model', 'like', "%{$request->q}%")
            ->limit(10)
            ->get(['id', 'registration_number', 'make', 'model', 'year']);

        return response()->json($vehicles);
    }
}

