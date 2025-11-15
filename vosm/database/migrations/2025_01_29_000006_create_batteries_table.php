<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('batteries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('serial_number')->unique();
            $table->string('brand');
            $table->string('model');
            $table->string('capacity'); // e.g., "100Ah"
            $table->string('voltage'); // e.g., "12V"
            $table->date('purchase_date');
            $table->date('warranty_expires_at');
            $table->decimal('purchase_cost', 10, 2);
            $table->uuid('current_vehicle_id')->nullable();
            $table->string('status')->default('active'); // 'active', 'maintenance', 'retired'
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('current_vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->index('serial_number');
            $table->index(['status', 'current_vehicle_id']);
            $table->index('warranty_expires_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('batteries');
    }
};

