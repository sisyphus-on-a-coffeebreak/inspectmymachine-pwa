<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add QR code fields to visitor_gate_passes
        if (Schema::hasTable('visitor_gate_passes')) {
            Schema::table('visitor_gate_passes', function (Blueprint $table) {
                $table->text('qr_payload')->nullable()->after('access_code');
                $table->string('qr_token', 100)->unique()->nullable()->after('qr_payload');
                $table->timestamp('qr_expires_at')->nullable()->after('qr_token');
                $table->index('qr_token');
                $table->index('qr_expires_at');
            });
        }

        // Add QR code fields to vehicle_entry_passes
        if (Schema::hasTable('vehicle_entry_passes')) {
            Schema::table('vehicle_entry_passes', function (Blueprint $table) {
                $table->text('qr_payload')->nullable()->after('access_code');
                $table->string('qr_token', 100)->unique()->nullable()->after('qr_payload');
                $table->timestamp('qr_expires_at')->nullable()->after('qr_token');
                $table->index('qr_token');
                $table->index('qr_expires_at');
            });
        }

        // Add QR code fields to vehicle_exit_passes
        if (Schema::hasTable('vehicle_exit_passes')) {
            Schema::table('vehicle_exit_passes', function (Blueprint $table) {
                $table->text('qr_payload')->nullable()->after('access_code');
                $table->string('qr_token', 100)->unique()->nullable()->after('qr_payload');
                $table->timestamp('qr_expires_at')->nullable()->after('qr_token');
                $table->index('qr_token');
                $table->index('qr_expires_at');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('visitor_gate_passes')) {
            Schema::table('visitor_gate_passes', function (Blueprint $table) {
                $table->dropIndex(['qr_token']);
                $table->dropIndex(['qr_expires_at']);
                $table->dropColumn(['qr_payload', 'qr_token', 'qr_expires_at']);
            });
        }

        if (Schema::hasTable('vehicle_entry_passes')) {
            Schema::table('vehicle_entry_passes', function (Blueprint $table) {
                $table->dropIndex(['qr_token']);
                $table->dropIndex(['qr_expires_at']);
                $table->dropColumn(['qr_payload', 'qr_token', 'qr_expires_at']);
            });
        }

        if (Schema::hasTable('vehicle_exit_passes')) {
            Schema::table('vehicle_exit_passes', function (Blueprint $table) {
                $table->dropIndex(['qr_token']);
                $table->dropIndex(['qr_expires_at']);
                $table->dropColumn(['qr_payload', 'qr_token', 'qr_expires_at']);
            });
        }
    }
};

