<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('component_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('component_type'); // 'battery', 'tyre', 'spare_part'
            $table->uuid('component_id');
            $table->uuid('from_vehicle_id')->nullable();
            $table->uuid('to_vehicle_id');
            $table->uuid('requested_by');
            $table->uuid('approved_by')->nullable();
            $table->string('status')->default('pending'); // 'pending', 'approved', 'rejected'
            $table->text('reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->foreign('from_vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->foreign('to_vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['component_type', 'component_id']);
            $table->index(['status', 'requested_at']);
            $table->index('requested_by');
        });
    }

    public function down()
    {
        Schema::dropIfExists('component_transfers');
    }
};


