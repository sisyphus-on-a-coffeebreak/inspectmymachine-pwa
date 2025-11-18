<?php

namespace App\Http\Controllers;

use App\Models\OverdueFlag;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OverdueFlagController extends Controller
{
    /**
     * List overdue flags with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = OverdueFlag::with(['resolvedByUser']);

        // Filters
        if ($request->item_type) {
            $query->where('item_type', $request->item_type);
        }

        if ($request->reason) {
            $query->where('reason', $request->reason);
        }

        if ($request->resolved === 'true') {
            $query->whereNotNull('resolved_at');
        } elseif ($request->resolved === 'false') {
            $query->whereNull('resolved_at');
        }

        $flags = $query->orderBy('flagged_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $flags
        ]);
    }

    /**
     * Resolve an overdue flag
     */
    public function resolve(string $id): JsonResponse
    {
        $flag = OverdueFlag::findOrFail($id);
        
        if ($flag->resolved_at) {
            return response()->json([
                'success' => false,
                'message' => 'Flag is already resolved'
            ], 400);
        }

        $flag->update([
            'resolved_at' => now(),
            'resolved_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $flag->fresh(['resolvedByUser'])
        ]);
    }

    /**
     * Get flags for a specific item
     */
    public function getItemFlags(string $itemType, string $itemId): JsonResponse
    {
        $flags = OverdueFlag::where('item_type', $itemType)
            ->where('item_id', $itemId)
            ->whereNull('resolved_at')
            ->orderBy('flagged_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $flags
        ]);
    }
}


