<?php

namespace App\Console\Commands;

use App\Models\ComponentMaintenance;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CheckMaintenanceReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'maintenance:check-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for components with upcoming maintenance due dates and create notifications';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting maintenance reminder check...');
        
        $count = $this->checkMaintenanceReminders();
        
        $this->info("Maintenance reminder check completed. Created {$count} notification(s).");
        Log::info('Maintenance reminders checked', ['count' => $count]);
        
        return Command::SUCCESS;
    }

    /**
     * Check for components with maintenance due within 7 days
     */
    protected function checkMaintenanceReminders(): int
    {
        $count = 0;
        $daysAhead = 7; // Check for maintenance due within 7 days
        
        $today = Carbon::today();
        $futureDate = Carbon::today()->addDays($daysAhead);
        
        // Get all maintenance records with next_due_date within the next 7 days
        $upcomingMaintenance = ComponentMaintenance::whereNotNull('next_due_date')
            ->whereBetween('next_due_date', [$today, $futureDate])
            ->with('component')
            ->get();
        
        // Get users who should receive notifications (admins, supervisors, and component owners)
        $adminUsers = DB::table('users')
            ->whereIn('role', ['super_admin', 'admin', 'supervisor'])
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();
        
        foreach ($upcomingMaintenance as $maintenance) {
            $component = $maintenance->component();
            if (!$component) {
                continue;
            }
            
            $daysUntilDue = Carbon::parse($maintenance->next_due_date)->diffInDays($today);
            $isOverdue = Carbon::parse($maintenance->next_due_date)->isPast();
            
            // Get component owner (if component is assigned to a vehicle, notify vehicle owner)
            $notifyUserIds = $adminUsers;
            
            if ($component->current_vehicle_id) {
                $vehicle = DB::table('vehicles')
                    ->where('id', $component->current_vehicle_id)
                    ->first();
                
                if ($vehicle && $vehicle->owner_id) {
                    $notifyUserIds[] = $vehicle->owner_id;
                }
            }
            
            // Remove duplicates
            $notifyUserIds = array_unique($notifyUserIds);
            
            // Create notification for each user
            foreach ($notifyUserIds as $userId) {
                $componentName = $this->getComponentName($component, $maintenance->component_type);
                
                $message = $isOverdue
                    ? "Maintenance for {$componentName} is overdue. Last maintenance: {$maintenance->title}."
                    : "Maintenance for {$componentName} is due in {$daysUntilDue} day(s). Last maintenance: {$maintenance->title}.";
                
                $this->notificationService->createNotification([
                    'user_id' => $userId,
                    'type' => $isOverdue ? 'warning' : 'info',
                    'title' => $isOverdue 
                        ? "Maintenance Overdue: {$componentName}"
                        : "Maintenance Due Soon: {$componentName}",
                    'message' => $message,
                    'action_url' => "/app/stockyard/components/{$maintenance->component_type}/{$maintenance->component_id}",
                    'send_email' => false, // Can be enabled if email notifications are needed
                ]);
                
                $count++;
            }
        }
        
        return $count;
    }

    /**
     * Get component display name
     */
    protected function getComponentName($component, string $componentType): string
    {
        if ($componentType === 'spare_part') {
            return $component->name ?? 'Spare Part';
        }
        
        $name = trim(($component->brand ?? '') . ' ' . ($component->model ?? ''));
        if (empty($name)) {
            $name = $component->serial_number ?? $component->part_number ?? 'Component';
        }
        
        return $name;
    }
}


