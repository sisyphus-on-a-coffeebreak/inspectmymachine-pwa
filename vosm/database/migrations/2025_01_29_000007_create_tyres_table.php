<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tyres', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('serial_number')->unique();
            $table->string('brand');
            $table->string('model');
            $table->string('size'); // e.g., "205/65R15"
            $table->integer('tread_depth_mm')->nullable();
            $table->date('purchase_date');
            $table->date('warranty_expires_at');
            $table->decimal('purchase_cost', 10, 2);
            $table->uuid('current_vehicle_id')->nullable();
            $table->string('position')->nullable(); // 'front_left', 'front_right', 'rear_left', 'rear_right', 'spare'
            $table->string('status')->default('active'); // 'active', 'needs_replacement', 'retired'
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('current_vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->index('serial_number');
            $table->index(['status', 'current_vehicle_id']);
            $table->index(['current_vehicle_id', 'position']);
            $table->index('warranty_expires_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('tyres');
    }
};


