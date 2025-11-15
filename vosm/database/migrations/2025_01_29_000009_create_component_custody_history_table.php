<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('component_custody_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('component_type'); // 'battery', 'tyre', 'spare_part'
            $table->uuid('component_id');
            $table->uuid('from_vehicle_id')->nullable();
            $table->uuid('to_vehicle_id')->nullable();
            $table->uuid('transferred_by');
            $table->uuid('approved_by')->nullable();
            $table->string('transfer_type'); // 'install', 'remove', 'transfer'
            $table->text('reason')->nullable();
            $table->timestamp('transferred_at');
            $table->timestamps();
            
            $table->foreign('from_vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->foreign('to_vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->foreign('transferred_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['component_type', 'component_id']);
            $table->index(['to_vehicle_id', 'transferred_at']);
            $table->index(['from_vehicle_id', 'transferred_at']);
            $table->index('transferred_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('component_custody_history');
    }
};

