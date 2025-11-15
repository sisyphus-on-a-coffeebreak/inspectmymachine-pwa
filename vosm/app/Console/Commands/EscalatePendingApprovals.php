<?php

namespace App\Console\Commands;

use App\Models\Alert;
use App\Services\AlertService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ExpenseEscalationNotification;
use Carbon\Carbon;

class EscalatePendingApprovals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'approvals:escalate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Escalate pending expense approvals that are overdue';

    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        parent::__construct();
        $this->alertService = $alertService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting approval escalation...');
        
        $count = $this->escalateExpenseApprovals();
        
        $this->info("Escalation completed. Escalated {$count} expense(s).");
        Log::info('Approval escalation completed', ['count' => $count]);
        
        return Command::SUCCESS;
    }

    /**
     * Escalate expense approvals pending > 7 days
     */
    protected function escalateExpenseApprovals(): int
    {
        $count = 0;
        $threshold = 7; // days
        
        $overdueExpenses = DB::table('expenses')
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays($threshold))
            ->where(function ($query) {
                $query->whereNull('escalated_at')
                      ->orWhere('escalation_level', 0);
            })
            ->get();

        foreach ($overdueExpenses as $expense) {
            $daysPending = Carbon::parse($expense->created_at)->diffInDays(Carbon::now());
            
            try {
                DB::beginTransaction();
                
                // Update expense with escalation
                $escalationLevel = $expense->escalation_level ?? 0;
                $newEscalationLevel = $escalationLevel + 1;
                
                // Find supervisors/admins to escalate to
                $supervisors = DB::table('users')
                    ->whereIn('role', ['super_admin', 'admin', 'supervisor'])
                    ->where('is_active', true)
                    ->get();
                
                if ($supervisors->isEmpty()) {
                    Log::warning('No supervisors found for escalation', ['expense_id' => $expense->id]);
                    DB::rollBack();
                    continue;
                }
                
                // Update expense
                DB::table('expenses')
                    ->where('id', $expense->id)
                    ->update([
                        'escalated_at' => now(),
                        'escalated_to' => $supervisors->first()->id, // Escalate to first supervisor
                        'escalation_level' => $newEscalationLevel,
                        'updated_at' => now(),
                    ]);
                
                // Create alert for escalation
                $existingAlert = Alert::where('module', 'expense')
                    ->where('item_type', 'expense')
                    ->where('item_id', $expense->id)
                    ->where('type', 'escalation')
                    ->where('title', 'like', '%Escalated%')
                    ->whereIn('status', ['new', 'acknowledged'])
                    ->first();

                if (!$existingAlert) {
                    $this->alertService->createAlert([
                        'type' => 'escalation',
                        'severity' => $newEscalationLevel >= 2 ? 'critical' : 'error',
                        'module' => 'expense',
                        'title' => "Expense Escalated (Level {$newEscalationLevel})",
                        'description' => "Expense #{$expense->id} has been pending approval for {$daysPending} days. Escalated to supervisor.",
                        'item_type' => 'expense',
                        'item_id' => $expense->id,
                        'assigned_to' => $supervisors->first()->id,
                    ]);
                }
                
                // Send notifications to supervisors
                foreach ($supervisors as $supervisor) {
                    try {
                        // Create notification record (if notifications table exists)
                        if (DB::getSchemaBuilder()->hasTable('notifications')) {
                            DB::table('notifications')->insert([
                                'id' => (string) \Illuminate\Support\Str::uuid(),
                                'type' => ExpenseEscalationNotification::class,
                                'notifiable_type' => 'App\\Models\\User',
                                'notifiable_id' => $supervisor->id,
                                'data' => json_encode([
                                    'type' => 'expense_escalation',
                                    'expense_id' => $expense->id,
                                    'amount' => $expense->amount,
                                    'category' => $expense->category,
                                    'description' => $expense->description,
                                    'days_pending' => $daysPending,
                                    'message' => "Expense #{$expense->id} has been pending approval for {$daysPending} days.",
                                    'action_url' => "/app/expenses/{$expense->id}",
                                ]),
                                'read_at' => null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to send escalation notification', [
                            'expense_id' => $expense->id,
                            'supervisor_id' => $supervisor->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                DB::commit();
                $count++;
                
                Log::info('Expense escalated', [
                    'expense_id' => $expense->id,
                    'days_pending' => $daysPending,
                    'escalation_level' => $newEscalationLevel
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error escalating expense: ' . $e->getMessage(), [
                    'expense_id' => $expense->id
                ]);
            }
        }

        return $count;
    }
}

