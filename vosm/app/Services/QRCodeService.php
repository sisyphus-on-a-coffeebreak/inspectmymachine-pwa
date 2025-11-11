<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class QRCodeService
{
    /**
     * Generate QR code payload for a gate pass
     *
     * @param string $passId The UUID of the pass
     * @param string $passType The type of pass: 'visitor', 'vehicle_entry', or 'vehicle_exit'
     * @return array Returns array with qr_payload, qr_token, and qr_expires_at
     */
    public function generatePayload(string $passId, string $passType): array
    {
        // Generate a secure random token (32 characters)
        $token = Str::random(32);
        
        // Set expiry to 30 days from now
        $expiresAt = Carbon::now()->addDays(30);
        
        // Get the base URL from config or environment
        $baseUrl = config('app.url', env('APP_URL', 'http://localhost:8000'));
        
        // Generate the verification URL
        $verificationUrl = rtrim($baseUrl, '/') . '/api/gate-pass-validation/verify?token=' . $token;
        
        return [
            'qr_payload' => $verificationUrl,
            'qr_token' => $token,
            'qr_expires_at' => $expiresAt->toDateTimeString()
        ];
    }

    /**
     * Verify a QR token and return pass details
     *
     * @param string $token The QR token to verify
     * @return array|null Returns pass details or null if invalid/expired
     */
    public function verifyToken(string $token): ?array
    {
        // Check visitor_gate_passes
        $visitorPass = DB::table('visitor_gate_passes')
            ->where('qr_token', $token)
            ->where('qr_expires_at', '>', Carbon::now())
            ->first();
        
        if ($visitorPass) {
            return [
                'pass_id' => $visitorPass->id,
                'pass_type' => 'visitor',
                'pass_number' => $visitorPass->pass_number ?? null,
                'visitor_name' => $visitorPass->visitor_name ?? null,
                'status' => $visitorPass->status ?? null,
                'valid_from' => $visitorPass->valid_from ?? null,
                'valid_to' => $visitorPass->valid_to ?? null,
                'expires_at' => $visitorPass->qr_expires_at ?? null
            ];
        }
        
        // Check vehicle_entry_passes
        $entryPass = DB::table('vehicle_entry_passes')
            ->where('qr_token', $token)
            ->where('qr_expires_at', '>', Carbon::now())
            ->first();
        
        if ($entryPass) {
            return [
                'pass_id' => $entryPass->id,
                'pass_type' => 'vehicle_entry',
                'pass_number' => $entryPass->pass_number ?? null,
                'vehicle_id' => $entryPass->vehicle_id ?? null,
                'status' => $entryPass->status ?? null,
                'valid_from' => $entryPass->valid_from ?? null,
                'valid_to' => $entryPass->valid_to ?? null,
                'expires_at' => $entryPass->qr_expires_at ?? null
            ];
        }
        
        // Check vehicle_exit_passes
        $exitPass = DB::table('vehicle_exit_passes')
            ->where('qr_token', $token)
            ->where('qr_expires_at', '>', Carbon::now())
            ->first();
        
        if ($exitPass) {
            return [
                'pass_id' => $exitPass->id,
                'pass_type' => 'vehicle_exit',
                'pass_number' => $exitPass->pass_number ?? null,
                'vehicle_id' => $exitPass->vehicle_id ?? null,
                'status' => $exitPass->status ?? null,
                'valid_from' => $exitPass->valid_from ?? null,
                'valid_to' => $exitPass->valid_to ?? null,
                'expires_at' => $exitPass->qr_expires_at ?? null
            ];
        }
        
        return null;
    }
}

