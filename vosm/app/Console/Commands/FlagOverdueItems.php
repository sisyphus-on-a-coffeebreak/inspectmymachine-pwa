<?php

namespace App\Console\Commands;

use App\Models\OverdueFlag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class FlagOverdueItems extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'items:flag-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Flag overdue items across all modules';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting overdue items flagging...');
        
        $count = 0;
        $count += $this->flagOverdueInspections();
        $count += $this->flagOverdueApprovals();
        $count += $this->flagLongStayVisitors();
        $count += $this->flagOverdueStockyardRequests();
        
        $this->info("Overdue flagging completed. Flagged {$count} item(s).");
        Log::info('Overdue items flagged', ['count' => $count]);
        
        return Command::SUCCESS;
    }

    /**
     * Flag inspections overdue > 30 days
     */
    protected function flagOverdueInspections(): int
    {
        $count = 0;
        $threshold = 30; // days
        
        $overdueInspections = DB::table('inspections')
            ->whereNotNull('started_at')
            ->whereNull('completed_at')
            ->whereNotIn('status', ['archived', 'rejected'])
            ->get()
            ->filter(function ($inspection) use ($threshold) {
                $daysSinceStart = Carbon::parse($inspection->started_at)->diffInDays(Carbon::now());
                return $daysSinceStart > $threshold;
            });

        foreach ($overdueInspections as $inspection) {
            $daysSinceStart = Carbon::parse($inspection->started_at)->diffInDays(Carbon::now());
            
            // Check if flag already exists
            $existingFlag = OverdueFlag::where('item_type', 'inspection')
                ->where('item_id', $inspection->id)
                ->where('reason', 'overdue_inspection')
                ->whereNull('resolved_at')
                ->first();

            if (!$existingFlag) {
                OverdueFlag::create([
                    'item_type' => 'inspection',
                    'item_id' => $inspection->id,
                    'reason' => 'overdue_inspection',
                    'description' => "Inspection started {$daysSinceStart} days ago and is still incomplete.",
                    'flagged_at' => now(),
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Flag expenses pending approval > 7 days
     */
    protected function flagOverdueApprovals(): int
    {
        $count = 0;
        $threshold = 7; // days
        
        $overdueExpenses = DB::table('expenses')
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays($threshold))
            ->get();

        foreach ($overdueExpenses as $expense) {
            $daysPending = Carbon::parse($expense->created_at)->diffInDays(Carbon::now());
            
            // Check if flag already exists
            $existingFlag = OverdueFlag::where('item_type', 'expense')
                ->where('item_id', $expense->id)
                ->where('reason', 'overdue_approval')
                ->whereNull('resolved_at')
                ->first();

            if (!$existingFlag) {
                OverdueFlag::create([
                    'item_type' => 'expense',
                    'item_id' => $expense->id,
                    'reason' => 'overdue_approval',
                    'description' => "Expense has been pending approval for {$daysPending} days.",
                    'flagged_at' => now(),
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Flag visitors inside > 8 hours
     */
    protected function flagLongStayVisitors(): int
    {
        $count = 0;
        $threshold = 8; // hours
        
        $longStayVisitors = DB::table('visitor_gate_passes')
            ->whereNotNull('entry_time')
            ->whereNull('exit_time')
            ->where('status', 'active')
            ->get()
            ->filter(function ($visitor) use ($threshold) {
                $hoursInside = Carbon::parse($visitor->entry_time)->diffInHours(Carbon::now());
                return $hoursInside > $threshold;
            });

        foreach ($longStayVisitors as $visitor) {
            $hoursInside = Carbon::parse($visitor->entry_time)->diffInHours(Carbon::now());
            
            // Check if flag already exists
            $existingFlag = OverdueFlag::where('item_type', 'visitor_gate_pass')
                ->where('item_id', $visitor->id)
                ->where('reason', 'long_stay_visitor')
                ->whereNull('resolved_at')
                ->first();

            if (!$existingFlag) {
                OverdueFlag::create([
                    'item_type' => 'visitor_gate_pass',
                    'item_id' => $visitor->id,
                    'reason' => 'long_stay_visitor',
                    'description' => "Visitor has been inside for {$hoursInside} hours.",
                    'flagged_at' => now(),
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Flag stockyard requests pending > 3 days
     */
    protected function flagOverdueStockyardRequests(): int
    {
        $count = 0;
        $threshold = 3; // days
        
        // Check if stockyard_requests table exists
        if (!Schema::hasTable('stockyard_requests')) {
            return 0;
        }
        
        $overdueRequests = DB::table('stockyard_requests')
            ->whereIn('status', ['pending', 'in_progress'])
            ->where('created_at', '<', Carbon::now()->subDays($threshold))
            ->get();

        foreach ($overdueRequests as $request) {
            $daysPending = Carbon::parse($request->created_at)->diffInDays(Carbon::now());
            
            // Check if flag already exists
            $existingFlag = OverdueFlag::where('item_type', 'stockyard_request')
                ->where('item_id', $request->id)
                ->where('reason', 'overdue_stockyard_request')
                ->whereNull('resolved_at')
                ->first();

            if (!$existingFlag) {
                OverdueFlag::create([
                    'item_type' => 'stockyard_request',
                    'item_id' => $request->id,
                    'reason' => 'overdue_stockyard_request',
                    'description' => "Stockyard request has been pending for {$daysPending} days.",
                    'flagged_at' => now(),
                ]);
                $count++;
            }
        }

        return $count;
    }
}

