<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('overdue_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('item_type'); // 'inspection', 'gate_pass', 'expense', 'stockyard_request', 'visitor_gate_pass', 'vehicle_entry_pass', 'vehicle_exit_pass'
            $table->uuid('item_id');
            $table->string('reason'); // 'overdue_inspection', 'long_stay_visitor', 'overdue_approval', 'overdue_stockyard_request'
            $table->text('description')->nullable();
            $table->timestamp('flagged_at');
            $table->timestamp('resolved_at')->nullable();
            $table->uuid('resolved_by')->nullable();
            $table->timestamps();
            
            $table->foreign('resolved_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['item_type', 'item_id']);
            $table->index(['item_type', 'resolved_at']);
            $table->unique(['item_type', 'item_id', 'reason']); // Prevent duplicate flags for same reason
        });
    }

    public function down()
    {
        Schema::dropIfExists('overdue_flags');
    }
};


