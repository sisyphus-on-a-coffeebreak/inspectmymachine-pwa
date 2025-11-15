<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ExpenseLinkingService
{
    /**
     * Auto-link expense to related items
     * 
     * @param string $expenseId
     * @param array $expenseData
     * @return int Number of links created
     */
    public function linkExpenseToRelatedItems(string $expenseId, array $expenseData): int
    {
        $linksCreated = 0;

        try {
            // Link based on same vehicle
            if (!empty($expenseData['asset_id'])) {
                $linksCreated += $this->linkByVehicle($expenseId, $expenseData['asset_id'], $expenseData['date'] ?? null);
            }

            // Link based on same date
            if (!empty($expenseData['date'])) {
                $linksCreated += $this->linkByDate($expenseId, $expenseData['date'], $expenseData['asset_id'] ?? null);
            }

            // Link based on keywords in description
            if (!empty($expenseData['description'])) {
                $linksCreated += $this->linkByKeywords($expenseId, $expenseData['description'], $expenseData['date'] ?? null);
            }

            // Link based on same project
            if (!empty($expenseData['project_id'])) {
                $linksCreated += $this->linkByProject($expenseId, $expenseData['project_id'], $expenseData['date'] ?? null);
            }

            Log::info('Expense auto-linking completed', [
                'expense_id' => $expenseId,
                'links_created' => $linksCreated
            ]);

            return $linksCreated;
        } catch (\Exception $e) {
            Log::error('Error auto-linking expense: ' . $e->getMessage(), [
                'expense_id' => $expenseId
            ]);
            return $linksCreated;
        }
    }

    /**
     * Link expense to items with same vehicle
     */
    protected function linkByVehicle(string $expenseId, string $vehicleId, ?string $expenseDate): int
    {
        $linksCreated = 0;
        $date = $expenseDate ? Carbon::parse($expenseDate) : null;

        // Link to gate passes (vehicle entry/exit) for same vehicle
        if ($date) {
            // Vehicle entry passes
            $entryPasses = DB::table('vehicle_entry_passes')
                ->where('vehicle_id', $vehicleId)
                ->whereDate('valid_from', '<=', $date)
                ->whereDate('valid_to', '>=', $date)
                ->get();

            foreach ($entryPasses as $pass) {
                $this->createLink($expenseId, 'vehicle_entry_pass', $pass->id, 'same_vehicle', 0.8);
                $linksCreated++;
            }

            // Vehicle exit passes
            $exitPasses = DB::table('vehicle_exit_passes')
                ->where('vehicle_id', $vehicleId)
                ->whereDate('valid_from', '<=', $date)
                ->whereDate('valid_to', '>=', $date)
                ->get();

            foreach ($exitPasses as $pass) {
                $this->createLink($expenseId, 'vehicle_exit_pass', $pass->id, 'same_vehicle', 0.8);
                $linksCreated++;
            }
        }

        // Link to inspections for same vehicle (within last 7 days)
        $inspectionDateFrom = $date ? $date->copy()->subDays(7) : Carbon::now()->subDays(7);
        $inspectionDateTo = $date ? $date->copy()->addDays(7) : Carbon::now();

        $inspections = DB::table('inspections')
            ->where('vehicle_id', $vehicleId)
            ->whereBetween('created_at', [$inspectionDateFrom, $inspectionDateTo])
            ->get();

        foreach ($inspections as $inspection) {
            $this->createLink($expenseId, 'inspection', $inspection->id, 'same_vehicle', 0.7);
            $linksCreated++;
        }

        return $linksCreated;
    }

    /**
     * Link expense to items on same date
     */
    protected function linkByDate(string $expenseId, string $expenseDate, ?string $vehicleId): int
    {
        $linksCreated = 0;
        $date = Carbon::parse($expenseDate);

        // Link to gate passes on same date
        $entryPasses = DB::table('vehicle_entry_passes')
            ->whereDate('valid_from', '<=', $date)
            ->whereDate('valid_to', '>=', $date)
            ->when($vehicleId, function ($query) use ($vehicleId) {
                return $query->where('vehicle_id', $vehicleId);
            })
            ->get();

        foreach ($entryPasses as $pass) {
            if (!$this->linkExists($expenseId, 'vehicle_entry_pass', $pass->id)) {
                $reason = $vehicleId && $pass->vehicle_id === $vehicleId ? 'same_vehicle' : 'same_date';
                $confidence = $vehicleId && $pass->vehicle_id === $vehicleId ? 0.8 : 0.5;
                $this->createLink($expenseId, 'vehicle_entry_pass', $pass->id, $reason, $confidence);
                $linksCreated++;
            }
        }

        $exitPasses = DB::table('vehicle_exit_passes')
            ->whereDate('valid_from', '<=', $date)
            ->whereDate('valid_to', '>=', $date)
            ->when($vehicleId, function ($query) use ($vehicleId) {
                return $query->where('vehicle_id', $vehicleId);
            })
            ->get();

        foreach ($exitPasses as $pass) {
            if (!$this->linkExists($expenseId, 'vehicle_exit_pass', $pass->id)) {
                $reason = $vehicleId && $pass->vehicle_id === $vehicleId ? 'same_vehicle' : 'same_date';
                $confidence = $vehicleId && $pass->vehicle_id === $vehicleId ? 0.8 : 0.5;
                $this->createLink($expenseId, 'vehicle_exit_pass', $pass->id, $reason, $confidence);
                $linksCreated++;
            }
        }

        // Link to visitor gate passes on same date
        $visitorPasses = DB::table('visitor_gate_passes')
            ->whereDate('valid_from', '<=', $date)
            ->whereDate('valid_to', '>=', $date)
            ->get();

        foreach ($visitorPasses as $pass) {
            if (!$this->linkExists($expenseId, 'visitor_gate_pass', $pass->id)) {
                $this->createLink($expenseId, 'visitor_gate_pass', $pass->id, 'same_date', 0.4);
                $linksCreated++;
            }
        }

        return $linksCreated;
    }

    /**
     * Link expense to items based on keyword matching in description
     */
    protected function linkByKeywords(string $expenseId, string $description, ?string $expenseDate): int
    {
        $linksCreated = 0;
        $keywords = $this->extractKeywords($description);
        
        if (empty($keywords)) {
            return 0;
        }

        $date = $expenseDate ? Carbon::parse($expenseDate) : null;
        $dateFrom = $date ? $date->copy()->subDays(3) : Carbon::now()->subDays(3);
        $dateTo = $date ? $date->copy()->addDays(3) : Carbon::now()->addDays(3);

        // Search in gate pass notes
        $gatePasses = DB::table('vehicle_entry_passes')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->where(function ($query) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $query->orWhere('notes', 'like', "%{$keyword}%");
                }
            })
            ->get();

        foreach ($gatePasses as $pass) {
            if (!$this->linkExists($expenseId, 'vehicle_entry_pass', $pass->id)) {
                $this->createLink($expenseId, 'vehicle_entry_pass', $pass->id, 'keyword_match', 0.6);
                $linksCreated++;
            }
        }

        $exitPasses = DB::table('vehicle_exit_passes')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->where(function ($query) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $query->orWhere('notes', 'like', "%{$keyword}%");
                }
            })
            ->get();

        foreach ($exitPasses as $pass) {
            if (!$this->linkExists($expenseId, 'vehicle_exit_pass', $pass->id)) {
                $this->createLink($expenseId, 'vehicle_exit_pass', $pass->id, 'keyword_match', 0.6);
                $linksCreated++;
            }
        }

        return $linksCreated;
    }

    /**
     * Link expense to items with same project
     */
    protected function linkByProject(string $expenseId, string $projectId, ?string $expenseDate): int
    {
        // Projects might be linked to other items in the future
        // For now, we'll just log that project linking is available
        return 0;
    }

    /**
     * Extract keywords from description
     */
    protected function extractKeywords(string $description): array
    {
        // Remove common words and extract meaningful keywords
        $stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
        
        $words = str_word_count(strtolower($description), 1);
        $keywords = array_filter($words, function ($word) use ($stopWords) {
            return strlen($word) > 3 && !in_array($word, $stopWords);
        });

        return array_unique(array_slice($keywords, 0, 5)); // Limit to 5 keywords
    }

    /**
     * Create a link if it doesn't already exist
     */
    protected function createLink(string $expenseId, string $linkedType, string $linkedId, string $reason, float $confidence): void
    {
        if ($this->linkExists($expenseId, $linkedType, $linkedId)) {
            return;
        }

        DB::table('expense_links')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'expense_id' => $expenseId,
            'linked_type' => $linkedType,
            'linked_id' => $linkedId,
            'link_reason' => $reason,
            'confidence_score' => $confidence,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Check if link already exists
     */
    protected function linkExists(string $expenseId, string $linkedType, string $linkedId): bool
    {
        return DB::table('expense_links')
            ->where('expense_id', $expenseId)
            ->where('linked_type', $linkedType)
            ->where('linked_id', $linkedId)
            ->exists();
    }

    /**
     * Get all links for an expense
     */
    public function getExpenseLinks(string $expenseId): array
    {
        return DB::table('expense_links')
            ->where('expense_id', $expenseId)
            ->orderBy('confidence_score', 'desc')
            ->get()
            ->toArray();
    }
}

