<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Inspection;
use App\Models\Battery;
use App\Models\Tyre;
use App\Models\SparePart;
use App\Models\ComponentMaintenance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AnomalyDetectionService
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Run all anomaly detection rules
     */
    public function detectAllAnomalies(): int
    {
        $count = 0;
        
        $count += $this->detectOverdueInspections();
        $count += $this->detectCriticalInspections();
        $count += $this->detectHighValueExpensesWithoutApproval();
        $count += $this->detectMissingReceipts();
        $count += $this->detectOverdueApprovals();
        $count += $this->detectLongStayVisitors();
        $count += $this->detectExpiredPasses();
        $count += $this->detectComponentWarrantyExpiring();
        $count += $this->detectComponentOverdueMaintenance();
        $count += $this->detectComponentHighUsage();
        
        Log::info('Anomaly detection completed', ['alerts_created' => $count]);
        
        return $count;
    }

    /**
     * Detect inspections overdue > 30 days
     */
    protected function detectOverdueInspections(): int
    {
        $count = 0;
        $threshold = 30; // days
        
        $overdueInspections = Inspection::whereNotNull('started_at')
            ->whereNull('completed_at')
            ->where('status', '!=', 'archived')
            ->where('status', '!=', 'rejected')
            ->get()
            ->filter(function ($inspection) use ($threshold) {
                $daysSinceStart = Carbon::parse($inspection->started_at)->diffInDays(Carbon::now());
                return $daysSinceStart > $threshold;
            });

        foreach ($overdueInspections as $inspection) {
            $daysSinceStart = Carbon::parse($inspection->started_at)->diffInDays(Carbon::now());
            
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'inspection')
                ->where('item_type', 'inspection')
                ->where('item_id', $inspection->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Overdue%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'error',
                    'module' => 'inspection',
                    'title' => 'Inspection Overdue > 30 Days',
                    'description' => "Inspection #{$inspection->id} was started {$daysSinceStart} days ago and is still incomplete. Please complete or cancel it.",
                    'item_type' => 'inspection',
                    'item_id' => $inspection->id,
                    'assigned_to' => $inspection->inspector_id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect inspections with critical issues
     */
    protected function detectCriticalInspections(): int
    {
        $count = 0;
        
        $criticalInspections = Inspection::where('has_critical_issues', true)
            ->whereIn('status', ['completed', 'under_review'])
            ->get();

        foreach ($criticalInspections as $inspection) {
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'inspection')
                ->where('item_type', 'inspection')
                ->where('item_id', $inspection->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Critical Issues%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $criticalCount = DB::table('inspection_answers')
                    ->where('inspection_id', $inspection->id)
                    ->where('is_critical_finding', true)
                    ->count();

                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'critical',
                    'module' => 'inspection',
                    'title' => 'Critical Issues Found in Inspection',
                    'description' => "Inspection #{$inspection->id} has {$criticalCount} critical finding(s). Immediate action may be required.",
                    'item_type' => 'inspection',
                    'item_id' => $inspection->id,
                    'assigned_to' => $inspection->reviewer_id ?? $inspection->inspector_id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect high-value expenses without approval
     */
    protected function detectHighValueExpensesWithoutApproval(): int
    {
        $count = 0;
        $threshold = 10000; // ₹10,000
        
        $expenses = DB::table('expenses')
            ->where('amount', '>', $threshold)
            ->whereNotIn('status', ['approved', 'rejected'])
            ->get();

        foreach ($expenses as $expense) {
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'expense')
                ->where('item_type', 'expense')
                ->where('item_id', $expense->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%High-Value%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'error',
                    'module' => 'expense',
                    'title' => 'High-Value Expense Without Approval',
                    'description' => "Expense #{$expense->id} is ₹" . number_format($expense->amount, 2) . " and requires approval. High-value expenses (> ₹10,000) need immediate attention.",
                    'item_type' => 'expense',
                    'item_id' => $expense->id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect expenses missing receipts (> ₹500)
     */
    protected function detectMissingReceipts(): int
    {
        $count = 0;
        $threshold = 500; // ₹500
        
        $expenses = DB::table('expenses')
            ->where('amount', '>', $threshold)
            ->where(function ($query) {
                $query->whereNull('receipts')
                      ->orWhere('receipts', '')
                      ->orWhere('receipts', '[]')
                      ->orWhere('receipts', 'null');
            })
            ->whereNotIn('status', ['rejected'])
            ->get();

        foreach ($expenses as $expense) {
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'expense')
                ->where('item_type', 'expense')
                ->where('item_id', $expense->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Receipt Missing%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'warning',
                    'module' => 'expense',
                    'title' => 'Receipt Missing for Expense > ₹500',
                    'description' => "Expense #{$expense->id} is ₹" . number_format($expense->amount, 2) . " but no receipt has been uploaded. Receipts are required for expenses above ₹500.",
                    'item_type' => 'expense',
                    'item_id' => $expense->id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect overdue approvals (> 7 days)
     */
    protected function detectOverdueApprovals(): int
    {
        $count = 0;
        $threshold = 7; // days
        
        // Check expense approvals
        $expenses = DB::table('expenses')
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays($threshold))
            ->get();

        foreach ($expenses as $expense) {
            $daysPending = Carbon::parse($expense->created_at)->diffInDays(Carbon::now());
            
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'expense')
                ->where('item_type', 'expense')
                ->where('item_id', $expense->id)
                ->where('type', 'escalation')
                ->where('title', 'like', '%Overdue Approval%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'escalation',
                    'severity' => 'warning',
                    'module' => 'expense',
                    'title' => 'Overdue Approval Request',
                    'description' => "Expense #{$expense->id} has been pending approval for {$daysPending} days. Please review and approve or reject.",
                    'item_type' => 'expense',
                    'item_id' => $expense->id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect visitors inside > 8 hours
     */
    protected function detectLongStayVisitors(): int
    {
        $count = 0;
        $threshold = 8; // hours
        
        // Check visitor gate passes
        $visitors = DB::table('visitor_gate_passes')
            ->whereNotNull('entry_time')
            ->whereNull('exit_time')
            ->where('status', 'active')
            ->get()
            ->filter(function ($visitor) use ($threshold) {
                $hoursInside = Carbon::parse($visitor->entry_time)->diffInHours(Carbon::now());
                return $hoursInside > $threshold;
            });

        foreach ($visitors as $visitor) {
            $hoursInside = Carbon::parse($visitor->entry_time)->diffInHours(Carbon::now());
            
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'gate_pass')
                ->where('item_type', 'visitor_gate_pass')
                ->where('item_id', $visitor->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Long Stay%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => $hoursInside > 12 ? 'error' : 'warning',
                    'module' => 'gate_pass',
                    'title' => 'Visitor Inside > 8 Hours',
                    'description' => "Visitor pass #{$visitor->id} has been active for {$hoursInside} hours. Please verify the visitor has exited.",
                    'item_type' => 'visitor_gate_pass',
                    'item_id' => $visitor->id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect expired passes still active
     */
    protected function detectExpiredPasses(): int
    {
        $count = 0;
        
        // Check visitor gate passes
        $expiredVisitors = DB::table('visitor_gate_passes')
            ->whereNotNull('valid_until')
            ->where('valid_until', '<', Carbon::now())
            ->where('status', 'active')
            ->get();

        foreach ($expiredVisitors as $pass) {
            // Check if alert already exists
            $existingAlert = Alert::where('module', 'gate_pass')
                ->where('item_type', 'visitor_gate_pass')
                ->where('item_id', $pass->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Expired%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'error',
                    'module' => 'gate_pass',
                    'title' => 'Pass Expired But Still Active',
                    'description' => "Visitor pass #{$pass->id} expired on " . Carbon::parse($pass->valid_until)->format('Y-m-d') . " but is still active. Please review and update its status.",
                    'item_type' => 'visitor_gate_pass',
                    'item_id' => $pass->id,
                ]);
                $count++;
            }
        }

        // Check vehicle entry passes
        $expiredVehicles = DB::table('vehicle_entry_passes')
            ->whereNotNull('valid_until')
            ->where('valid_until', '<', Carbon::now())
            ->where('status', 'active')
            ->get();

        foreach ($expiredVehicles as $pass) {
            $existingAlert = Alert::where('module', 'gate_pass')
                ->where('item_type', 'vehicle_entry_pass')
                ->where('item_id', $pass->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Expired%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();

            if (!$existingAlert) {
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'error',
                    'module' => 'gate_pass',
                    'title' => 'Pass Expired But Still Active',
                    'description' => "Vehicle entry pass #{$pass->id} expired on " . Carbon::parse($pass->valid_until)->format('Y-m-d') . " but is still active. Please review and update its status.",
                    'item_type' => 'vehicle_entry_pass',
                    'item_id' => $pass->id,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Detect components with warranty expiring in 30 days
     */
    protected function detectComponentWarrantyExpiring(): int
    {
        $count = 0;
        $threshold = 30; // days
        $warrantyThreshold = Carbon::now()->addDays($threshold);
        
        // Check batteries
        $batteries = Battery::whereNotNull('warranty_expires_at')
            ->where('warranty_expires_at', '<=', $warrantyThreshold)
            ->where('warranty_expires_at', '>=', Carbon::now())
            ->get();
        
        foreach ($batteries as $battery) {
            $daysUntilExpiry = Carbon::now()->diffInDays($battery->warranty_expires_at, false);
            
            $existingAlert = Alert::where('module', 'stockyard')
                ->where('item_type', 'component')
                ->where('item_id', $battery->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Warranty Expiring%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();
            
            if (!$existingAlert) {
                $componentName = trim(($battery->brand ?? '') . ' ' . ($battery->model ?? '')) ?: ($battery->serial_number ?? 'Battery');
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'warning',
                    'module' => 'stockyard',
                    'title' => 'Component Warranty Expiring Soon',
                    'description' => "Battery '{$componentName}' warranty expires in {$daysUntilExpiry} day(s) on " . $battery->warranty_expires_at->format('Y-m-d') . ". Consider replacement or warranty claim.",
                    'item_type' => 'component',
                    'item_id' => $battery->id,
                ]);
                $count++;
            }
        }
        
        // Check tyres
        $tyres = Tyre::whereNotNull('warranty_expires_at')
            ->where('warranty_expires_at', '<=', $warrantyThreshold)
            ->where('warranty_expires_at', '>=', Carbon::now())
            ->get();
        
        foreach ($tyres as $tyre) {
            $daysUntilExpiry = Carbon::now()->diffInDays($tyre->warranty_expires_at, false);
            
            $existingAlert = Alert::where('module', 'stockyard')
                ->where('item_type', 'component')
                ->where('item_id', $tyre->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Warranty Expiring%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();
            
            if (!$existingAlert) {
                $componentName = trim(($tyre->brand ?? '') . ' ' . ($tyre->model ?? '')) ?: ($tyre->serial_number ?? 'Tyre');
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'warning',
                    'module' => 'stockyard',
                    'title' => 'Component Warranty Expiring Soon',
                    'description' => "Tyre '{$componentName}' warranty expires in {$daysUntilExpiry} day(s) on " . $tyre->warranty_expires_at->format('Y-m-d') . ". Consider replacement or warranty claim.",
                    'item_type' => 'component',
                    'item_id' => $tyre->id,
                ]);
                $count++;
            }
        }
        
        // Check spare parts
        $spareParts = SparePart::whereNotNull('warranty_expires_at')
            ->where('warranty_expires_at', '<=', $warrantyThreshold)
            ->where('warranty_expires_at', '>=', Carbon::now())
            ->get();
        
        foreach ($spareParts as $sparePart) {
            $daysUntilExpiry = Carbon::now()->diffInDays($sparePart->warranty_expires_at, false);
            
            $existingAlert = Alert::where('module', 'stockyard')
                ->where('item_type', 'component')
                ->where('item_id', $sparePart->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Warranty Expiring%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();
            
            if (!$existingAlert) {
                $componentName = $sparePart->name ?? 'Spare Part';
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'warning',
                    'module' => 'stockyard',
                    'title' => 'Component Warranty Expiring Soon',
                    'description' => "Spare Part '{$componentName}' warranty expires in {$daysUntilExpiry} day(s) on " . $sparePart->warranty_expires_at->format('Y-m-d') . ". Consider replacement or warranty claim.",
                    'item_type' => 'component',
                    'item_id' => $sparePart->id,
                ]);
                $count++;
            }
        }
        
        return $count;
    }

    /**
     * Detect components with overdue maintenance
     */
    protected function detectComponentOverdueMaintenance(): int
    {
        $count = 0;
        
        $overdueMaintenance = ComponentMaintenance::whereNotNull('next_due_date')
            ->where('next_due_date', '<', Carbon::now())
            ->get();
        
        foreach ($overdueMaintenance as $maintenance) {
            $daysOverdue = Carbon::now()->diffInDays($maintenance->next_due_date, false);
            
            $existingAlert = Alert::where('module', 'stockyard')
                ->where('item_type', 'component_maintenance')
                ->where('item_id', $maintenance->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Overdue Maintenance%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();
            
            if (!$existingAlert) {
                $component = $maintenance->component();
                $componentName = 'Unknown Component';
                
                if ($component) {
                    if ($maintenance->component_type === 'spare_part') {
                        $componentName = $component->name ?? 'Spare Part';
                    } else {
                        $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
                        if (empty($componentName)) {
                            $componentName = $component->serial_number ?? $component->part_number ?? 'Component';
                        }
                    }
                }
                
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => abs($daysOverdue) > 30 ? 'error' : 'warning',
                    'module' => 'stockyard',
                    'title' => 'Component Maintenance Overdue',
                    'description' => "Maintenance '{$maintenance->title}' for component '{$componentName}' is " . abs($daysOverdue) . " day(s) overdue. Scheduled date: " . $maintenance->next_due_date->format('Y-m-d') . ".",
                    'item_type' => 'component_maintenance',
                    'item_id' => $maintenance->id,
                ]);
                $count++;
            }
        }
        
        return $count;
    }

    /**
     * Detect components with high usage (beyond expected lifespan)
     */
    protected function detectComponentHighUsage(): int
    {
        $count = 0;
        
        // Check tyres with low tread depth (below legal minimum or very low)
        $tyres = Tyre::whereNotNull('tread_depth_mm')
            ->where('tread_depth_mm', '<', 3.0) // Below 3mm is getting low
            ->where('status', '!=', 'retired')
            ->get();
        
        foreach ($tyres as $tyre) {
            $existingAlert = Alert::where('module', 'stockyard')
                ->where('item_type', 'component')
                ->where('item_id', $tyre->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%High Usage%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();
            
            if (!$existingAlert) {
                $componentName = trim(($tyre->brand ?? '') . ' ' . ($tyre->model ?? '')) ?: ($tyre->serial_number ?? 'Tyre');
                $severity = $tyre->tread_depth_mm < 1.6 ? 'error' : 'warning';
                $message = $tyre->tread_depth_mm < 1.6 
                    ? "Tyre '{$componentName}' has tread depth of {$tyre->tread_depth_mm}mm, which is below the legal minimum of 1.6mm. Immediate replacement required."
                    : "Tyre '{$componentName}' has low tread depth of {$tyre->tread_depth_mm}mm. Consider replacement soon.";
                
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => $severity,
                    'module' => 'stockyard',
                    'title' => 'Component High Usage / Low Tread Depth',
                    'description' => $message,
                    'item_type' => 'component',
                    'item_id' => $tyre->id,
                ]);
                $count++;
            }
        }
        
        // Check components with status 'needs_replacement'
        $allComponents = collect();
        $allComponents = $allComponents->merge(Battery::where('status', 'needs_replacement')->get());
        $allComponents = $allComponents->merge(SparePart::where('status', 'needs_replacement')->get());
        
        foreach ($allComponents as $component) {
            $existingAlert = Alert::where('module', 'stockyard')
                ->where('item_type', 'component')
                ->where('item_id', $component->id)
                ->where('type', 'anomaly')
                ->where('title', 'like', '%Needs Replacement%')
                ->whereIn('status', ['new', 'acknowledged'])
                ->first();
            
            if (!$existingAlert) {
                $componentName = '';
                if ($component instanceof Battery) {
                    $componentName = trim(($component->brand ?? '') . ' ' . ($component->model ?? '')) ?: ($component->serial_number ?? 'Battery');
                } elseif ($component instanceof SparePart) {
                    $componentName = $component->name ?? 'Spare Part';
                }
                
                $this->alertService->createAlert([
                    'type' => 'anomaly',
                    'severity' => 'error',
                    'module' => 'stockyard',
                    'title' => 'Component Needs Replacement',
                    'description' => "Component '{$componentName}' is marked as needing replacement. Please schedule replacement soon.",
                    'item_type' => 'component',
                    'item_id' => $component->id,
                ]);
                $count++;
            }
        }
        
        return $count;
    }
}

