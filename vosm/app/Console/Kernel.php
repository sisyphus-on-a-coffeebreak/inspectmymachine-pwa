<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Run anomaly detection daily at 2 AM
        $schedule->command('alerts:detect-anomalies')
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->runInBackground();
        
        // Flag overdue items daily at 3 AM
        $schedule->command('items:flag-overdue')
            ->dailyAt('03:00')
            ->withoutOverlapping()
            ->runInBackground();
        
        // Escalate pending approvals daily at 4 AM
        $schedule->command('approvals:escalate')
            ->dailyAt('04:00')
            ->withoutOverlapping()
            ->runInBackground();
        
        // Check maintenance reminders daily at 5 AM
        $schedule->command('maintenance:check-reminders')
            ->dailyAt('05:00')
            ->withoutOverlapping()
            ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

