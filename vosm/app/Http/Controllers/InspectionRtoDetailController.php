<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionRtoDetail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class InspectionRtoDetailController extends Controller
{
    /**
     * Get RTO details for an inspection
     */
    public function show(string $inspectionId): JsonResponse
    {
        $inspection = Inspection::findOrFail($inspectionId);
        
        $rtoDetails = InspectionRtoDetail::where('inspection_id', $inspectionId)
            ->with(['addedBy', 'verifiedBy'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => $rtoDetails,
        ]);
    }

    /**
     * Create or update RTO details for an inspection
     */
    public function store(Request $request, string $inspectionId): JsonResponse
    {
        $inspection = Inspection::findOrFail($inspectionId);
        
        // Only allow for completed inspections
        if (!in_array($inspection->status, ['completed', 'approved', 'under_review'])) {
            return response()->json([
                'success' => false,
                'message' => 'RTO details can only be added to completed inspections',
            ], 422);
        }

        $request->validate([
            'rc_number' => 'nullable|string|max:255',
            'rc_issue_date' => 'nullable|date',
            'rc_expiry_date' => 'nullable|date|after_or_equal:rc_issue_date',
            'rc_owner_name' => 'nullable|string|max:255',
            'rc_owner_address' => 'nullable|string',
            
            'fitness_certificate_number' => 'nullable|string|max:255',
            'fitness_issue_date' => 'nullable|date',
            'fitness_expiry_date' => 'nullable|date|after_or_equal:fitness_issue_date',
            'fitness_status' => ['nullable', Rule::in(['valid', 'expired', 'pending', 'not_applicable'])],
            
            'permit_number' => 'nullable|string|max:255',
            'permit_issue_date' => 'nullable|date',
            'permit_expiry_date' => 'nullable|date|after_or_equal:permit_issue_date',
            'permit_type' => ['nullable', Rule::in(['national', 'state', 'local', 'not_applicable'])],
            
            'insurance_policy_number' => 'nullable|string|max:255',
            'insurance_company' => 'nullable|string|max:255',
            'insurance_issue_date' => 'nullable|date',
            'insurance_expiry_date' => 'nullable|date|after_or_equal:insurance_issue_date',
            'insurance_type' => ['nullable', Rule::in(['third_party', 'comprehensive', 'not_applicable'])],
            
            'tax_certificate_number' => 'nullable|string|max:255',
            'tax_paid_date' => 'nullable|date',
            'tax_valid_until' => 'nullable|date|after_or_equal:tax_paid_date',
            
            'puc_certificate_number' => 'nullable|string|max:255',
            'puc_issue_date' => 'nullable|date',
            'puc_expiry_date' => 'nullable|date|after_or_equal:puc_issue_date',
            'puc_status' => ['nullable', Rule::in(['valid', 'expired', 'pending', 'not_applicable'])],
            
            'show_rc_details' => 'boolean',
            'show_fitness' => 'boolean',
            'show_permit' => 'boolean',
            'show_insurance' => 'boolean',
            'show_tax' => 'boolean',
            'show_puc' => 'boolean',
            
            'verification_notes' => 'nullable|string',
            'discrepancies' => 'nullable|string',
            'verification_status' => ['nullable', Rule::in(['pending', 'verified', 'discrepancy', 'rejected'])],
        ]);

        try {
            $rtoDetails = InspectionRtoDetail::updateOrCreate(
                ['inspection_id' => $inspectionId],
                array_merge($request->all(), [
                    'added_by' => auth()->id(),
                ])
            );

            Log::info('RTO details saved for inspection', [
                'inspection_id' => $inspectionId,
                'added_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'RTO details saved successfully',
                'data' => $rtoDetails->load(['addedBy']),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save RTO details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save RTO details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Verify RTO details
     */
    public function verify(Request $request, string $inspectionId): JsonResponse
    {
        $rtoDetails = InspectionRtoDetail::where('inspection_id', $inspectionId)->firstOrFail();
        
        $request->validate([
            'verification_status' => ['required', Rule::in(['verified', 'discrepancy', 'rejected'])],
            'verification_notes' => 'nullable|string',
        ]);

        try {
            $rtoDetails->update([
                'verification_status' => $request->verification_status,
                'verified_by' => auth()->id(),
                'verified_at' => now(),
                'verification_notes' => $request->verification_notes ?? $rtoDetails->verification_notes,
            ]);

            Log::info('RTO details verified', [
                'inspection_id' => $inspectionId,
                'verified_by' => auth()->id(),
                'status' => $request->verification_status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'RTO details verified successfully',
                'data' => $rtoDetails->load(['verifiedBy']),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to verify RTO details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify RTO details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

