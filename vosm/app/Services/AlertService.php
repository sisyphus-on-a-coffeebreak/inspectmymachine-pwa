<?php

namespace App\Services;

use App\Models\Alert;
use Illuminate\Support\Facades\Log;

class AlertService
{
    /**
     * Create a new alert
     */
    public function createAlert(array $data): Alert
    {
        $alert = Alert::create([
            'type' => $data['type'] ?? 'anomaly',
            'severity' => $data['severity'] ?? 'warning',
            'module' => $data['module'],
            'title' => $data['title'],
            'description' => $data['description'],
            'item_type' => $data['item_type'] ?? null,
            'item_id' => $data['item_id'] ?? null,
            'assigned_to' => $data['assigned_to'] ?? null,
            'status' => 'new',
        ]);

        Log::info('Alert created', [
            'alert_id' => $alert->id,
            'type' => $alert->type,
            'severity' => $alert->severity,
            'module' => $alert->module,
        ]);

        return $alert;
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledgeAlert(string $alertId, ?string $userId = null): Alert
    {
        $alert = Alert::findOrFail($alertId);
        
        if ($alert->status === 'new') {
            $alert->update([
                'status' => 'acknowledged',
            ]);
        }

        return $alert->fresh();
    }

    /**
     * Resolve an alert
     */
    public function resolveAlert(string $alertId, ?string $userId = null): Alert
    {
        $alert = Alert::findOrFail($alertId);
        
        $alert->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $userId ?? auth()->id(),
        ]);

        return $alert->fresh();
    }

    /**
     * Dismiss an alert
     */
    public function dismissAlert(string $alertId, ?string $userId = null): Alert
    {
        $alert = Alert::findOrFail($alertId);
        
        $alert->update([
            'status' => 'dismissed',
            'resolved_at' => now(),
            'resolved_by' => $userId ?? auth()->id(),
        ]);

        return $alert->fresh();
    }

    /**
     * Bulk acknowledge alerts
     */
    public function bulkAcknowledge(array $alertIds, ?string $userId = null): int
    {
        return Alert::whereIn('id', $alertIds)
            ->where('status', 'new')
            ->update([
                'status' => 'acknowledged',
            ]);
    }

    /**
     * Bulk resolve alerts
     */
    public function bulkResolve(array $alertIds, ?string $userId = null): int
    {
        return Alert::whereIn('id', $alertIds)
            ->whereIn('status', ['new', 'acknowledged'])
            ->update([
                'status' => 'resolved',
                'resolved_at' => now(),
                'resolved_by' => $userId ?? auth()->id(),
            ]);
    }

    /**
     * Bulk dismiss alerts
     */
    public function bulkDismiss(array $alertIds, ?string $userId = null): int
    {
        return Alert::whereIn('id', $alertIds)
            ->update([
                'status' => 'dismissed',
                'resolved_at' => now(),
                'resolved_by' => $userId ?? auth()->id(),
            ]);
    }

    /**
     * Get alert statistics
     */
    public function getStatistics(): array
    {
        $total = Alert::count();
        $new = Alert::where('status', 'new')->count();
        $acknowledged = Alert::where('status', 'acknowledged')->count();
        $resolved = Alert::where('status', 'resolved')->count();
        $critical = Alert::where('severity', 'critical')->whereIn('status', ['new', 'acknowledged'])->count();

        return [
            'total' => $total,
            'new' => $new,
            'acknowledged' => $acknowledged,
            'resolved' => $resolved,
            'critical' => $critical,
            'by_severity' => [
                'info' => Alert::where('severity', 'info')->whereIn('status', ['new', 'acknowledged'])->count(),
                'warning' => Alert::where('severity', 'warning')->whereIn('status', ['new', 'acknowledged'])->count(),
                'error' => Alert::where('severity', 'error')->whereIn('status', ['new', 'acknowledged'])->count(),
                'critical' => $critical,
            ],
            'by_module' => Alert::whereIn('status', ['new', 'acknowledged'])
                ->selectRaw('module, count(*) as count')
                ->groupBy('module')
                ->pluck('count', 'module')
                ->toArray(),
        ];
    }
}


