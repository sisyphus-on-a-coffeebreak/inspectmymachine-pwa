<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('spare_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('part_number')->unique();
            $table->string('name');
            $table->string('category'); // 'engine', 'electrical', 'body', 'suspension', 'brake', etc.
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->date('purchase_date');
            $table->date('warranty_expires_at')->nullable();
            $table->decimal('purchase_cost', 10, 2);
            $table->uuid('current_vehicle_id')->nullable();
            $table->string('status')->default('in_stock'); // 'in_stock', 'installed', 'retired'
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('current_vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->index('part_number');
            $table->index(['status', 'category']);
            $table->index(['current_vehicle_id', 'status']);
            $table->index('warranty_expires_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('spare_parts');
    }
};

