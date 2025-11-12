<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\QRCodeService;

/**
 * Migration: Backfill QR Payloads for Historical Gate Pass Records
 * 
 * This migration ensures all existing gate pass records have QR payloads
 * for verifiable QR code generation. Records without QR payloads will be
 * backfilled with new QR tokens and payloads.
 */
return new class extends Migration
{
    protected $qrCodeService;

    public function __construct()
    {
        $this->qrCodeService = app(QRCodeService::class);
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Log::info('Starting QR payload backfill migration');

        // Backfill visitor_gate_passes
        $this->backfillTable('visitor_gate_passes', 'visitor');

        // Backfill vehicle_entry_passes
        $this->backfillTable('vehicle_entry_passes', 'vehicle_entry');

        // Backfill vehicle_exit_passes
        $this->backfillTable('vehicle_exit_passes', 'vehicle_exit');

        Log::info('QR payload backfill migration completed');
    }

    /**
     * Backfill QR payloads for a specific table
     */
    private function backfillTable(string $tableName, string $passType): void
    {
        if (!DB::getSchemaBuilder()->hasTable($tableName)) {
            Log::warning("Table {$tableName} does not exist, skipping backfill");
            return;
        }

        // Find records without QR payloads
        $recordsWithoutQr = DB::table($tableName)
            ->where(function ($query) {
                $query->whereNull('qr_payload')
                    ->orWhere('qr_payload', '')
                    ->orWhereNull('qr_token');
            })
            ->get();

        $count = $recordsWithoutQr->count();
        Log::info("Found {$count} records in {$tableName} without QR payloads");

        if ($count === 0) {
            return;
        }

        $updated = 0;
        foreach ($recordsWithoutQr as $record) {
            try {
                $qrData = $this->qrCodeService->generatePayload($record->id, $passType);

                DB::table($tableName)
                    ->where('id', $record->id)
                    ->update([
                        'qr_payload' => $qrData['qr_payload'],
                        'qr_token' => $qrData['qr_token'],
                        'qr_expires_at' => $qrData['qr_expires_at'],
                        'updated_at' => now(),
                    ]);

                $updated++;
            } catch (\Exception $e) {
                Log::error("Failed to backfill QR payload for record {$record->id} in {$tableName}: " . $e->getMessage());
            }
        }

        Log::info("Updated {$updated} records in {$tableName} with QR payloads");
    }

    /**
     * Reverse the migrations.
     * 
     * Note: We don't remove QR payloads as they may be in use.
     * This is a one-way migration for data integrity.
     */
    public function down(): void
    {
        Log::info('QR payload backfill migration rollback - no action taken (data preservation)');
        // Intentionally left empty - we don't want to remove QR payloads
    }
};

