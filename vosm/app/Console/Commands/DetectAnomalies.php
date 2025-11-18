<?php

namespace App\Console\Commands;

use App\Services\AnomalyDetectionService;
use Illuminate\Console\Command;

class DetectAnomalies extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alerts:detect-anomalies';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detect anomalies across all modules and create alerts';

    /**
     * Execute the console command.
     */
    public function handle(AnomalyDetectionService $anomalyService): int
    {
        $this->info('Starting anomaly detection...');
        
        $count = $anomalyService->detectAllAnomalies();
        
        $this->info("Anomaly detection completed. Created {$count} alert(s).");
        
        return Command::SUCCESS;
    }
}


