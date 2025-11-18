<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // 'anomaly', 'reminder', 'escalation'
            $table->string('severity'); // 'info', 'warning', 'error', 'critical'
            $table->string('module'); // 'gate_pass', 'expense', 'inspection', 'stockyard'
            $table->string('title');
            $table->text('description');
            $table->string('item_type')->nullable(); // 'gate_pass', 'expense', etc.
            $table->uuid('item_id')->nullable();
            $table->uuid('assigned_to')->nullable(); // User who should handle this
            $table->string('status')->default('new'); // 'new', 'acknowledged', 'resolved', 'dismissed'
            $table->timestamp('resolved_at')->nullable();
            $table->uuid('resolved_by')->nullable();
            $table->timestamps();
            
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('resolved_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['status', 'severity']);
            $table->index(['module', 'item_type', 'item_id']);
            $table->index(['assigned_to', 'status']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('alerts');
    }
};


