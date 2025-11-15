<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Services\AlertService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class AlertController extends Controller
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * List alerts with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Alert::with(['assignedUser', 'resolvedByUser']);

        // Filters
        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->severity) {
            $query->where('severity', $request->severity);
        }

        if ($request->module) {
            $query->where('module', $request->module);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->item_type && $request->item_id) {
            $query->where('item_type', $request->item_type)
                  ->where('item_id', $request->item_id);
        }

        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $alerts = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $alerts
        ]);
    }

    /**
     * Get alert statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = $this->alertService->getStatistics();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Manually trigger anomaly detection (for testing/admin use)
     */
    public function detectAnomalies(): JsonResponse
    {
        try {
            $anomalyService = app(\App\Services\AnomalyDetectionService::class);
            $count = $anomalyService->detectAllAnomalies();

            return response()->json([
                'success' => true,
                'message' => "Anomaly detection completed. Created {$count} alert(s).",
                'data' => ['alerts_created' => $count]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to detect anomalies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a single alert
     */
    public function show(string $id): JsonResponse
    {
        $alert = Alert::with(['assignedUser', 'resolvedByUser'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $alert
        ]);
    }

    /**
     * Create a new alert
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['anomaly', 'reminder', 'escalation'])],
            'severity' => ['required', Rule::in(['info', 'warning', 'error', 'critical'])],
            'module' => ['required', Rule::in(['gate_pass', 'expense', 'inspection', 'stockyard'])],
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'item_type' => 'nullable|string',
            'item_id' => 'nullable|uuid',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $alert = $this->alertService->createAlert($validated);

        return response()->json([
            'success' => true,
            'data' => $alert->load(['assignedUser'])
        ], 201);
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledge(string $id): JsonResponse
    {
        $alert = $this->alertService->acknowledgeAlert($id, auth()->id());

        return response()->json([
            'success' => true,
            'data' => $alert
        ]);
    }

    /**
     * Resolve an alert
     */
    public function resolve(string $id): JsonResponse
    {
        $alert = $this->alertService->resolveAlert($id, auth()->id());

        return response()->json([
            'success' => true,
            'data' => $alert
        ]);
    }

    /**
     * Dismiss an alert
     */
    public function dismiss(string $id): JsonResponse
    {
        $alert = $this->alertService->dismissAlert($id, auth()->id());

        return response()->json([
            'success' => true,
            'data' => $alert
        ]);
    }

    /**
     * Bulk acknowledge alerts
     */
    public function bulkAcknowledge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alert_ids' => 'required|array',
            'alert_ids.*' => 'required|uuid|exists:alerts,id',
        ]);

        $count = $this->alertService->bulkAcknowledge($validated['alert_ids'], auth()->id());

        return response()->json([
            'success' => true,
            'message' => "{$count} alert(s) acknowledged",
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Bulk resolve alerts
     */
    public function bulkResolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alert_ids' => 'required|array',
            'alert_ids.*' => 'required|uuid|exists:alerts,id',
        ]);

        $count = $this->alertService->bulkResolve($validated['alert_ids'], auth()->id());

        return response()->json([
            'success' => true,
            'message' => "{$count} alert(s) resolved",
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Bulk dismiss alerts
     */
    public function bulkDismiss(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alert_ids' => 'required|array',
            'alert_ids.*' => 'required|uuid|exists:alerts,id',
        ]);

        $count = $this->alertService->bulkDismiss($validated['alert_ids'], auth()->id());

        return response()->json([
            'success' => true,
            'message' => "{$count} alert(s) dismissed",
            'data' => ['count' => $count]
        ]);
    }
}

