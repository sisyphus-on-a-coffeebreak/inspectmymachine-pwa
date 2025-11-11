<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add approval fields to visitor_gate_passes
        if (Schema::hasTable('visitor_gate_passes')) {
            Schema::table('visitor_gate_passes', function (Blueprint $table) {
                $table->boolean('requires_approval')->default(false)->after('status');
                $table->enum('approval_status', ['not_required', 'pending', 'approved', 'rejected'])->default('not_required')->after('requires_approval');
                $table->uuid('approval_request_id')->nullable()->after('approval_status');
                $table->foreign('approval_request_id')->references('id')->on('approval_requests')->onDelete('set null');
                $table->index('approval_status');
            });
        }

        // Add approval fields to vehicle_entry_passes
        if (Schema::hasTable('vehicle_entry_passes')) {
            Schema::table('vehicle_entry_passes', function (Blueprint $table) {
                $table->boolean('requires_approval')->default(false)->after('status');
                $table->enum('approval_status', ['not_required', 'pending', 'approved', 'rejected'])->default('not_required')->after('requires_approval');
                $table->uuid('approval_request_id')->nullable()->after('approval_status');
                $table->foreign('approval_request_id')->references('id')->on('approval_requests')->onDelete('set null');
                $table->index('approval_status');
            });
        }

        // Add approval fields to vehicle_exit_passes
        if (Schema::hasTable('vehicle_exit_passes')) {
            Schema::table('vehicle_exit_passes', function (Blueprint $table) {
                $table->boolean('requires_approval')->default(false)->after('status');
                $table->enum('approval_status', ['not_required', 'pending', 'approved', 'rejected'])->default('not_required')->after('requires_approval');
                $table->uuid('approval_request_id')->nullable()->after('approval_status');
                $table->foreign('approval_request_id')->references('id')->on('approval_requests')->onDelete('set null');
                $table->index('approval_status');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('visitor_gate_passes')) {
            Schema::table('visitor_gate_passes', function (Blueprint $table) {
                $table->dropForeign(['approval_request_id']);
                $table->dropIndex(['approval_status']);
                $table->dropColumn(['requires_approval', 'approval_status', 'approval_request_id']);
            });
        }

        if (Schema::hasTable('vehicle_entry_passes')) {
            Schema::table('vehicle_entry_passes', function (Blueprint $table) {
                $table->dropForeign(['approval_request_id']);
                $table->dropIndex(['approval_status']);
                $table->dropColumn(['requires_approval', 'approval_status', 'approval_request_id']);
            });
        }

        if (Schema::hasTable('vehicle_exit_passes')) {
            Schema::table('vehicle_exit_passes', function (Blueprint $table) {
                $table->dropForeign(['approval_request_id']);
                $table->dropIndex(['approval_status']);
                $table->dropColumn(['requires_approval', 'approval_status', 'approval_request_id']);
            });
        }
    }
};

