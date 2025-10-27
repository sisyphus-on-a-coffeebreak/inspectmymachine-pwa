<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('registration_number')->unique();
            $table->string('chassis_number')->nullable();
            $table->string('engine_number')->nullable();
            $table->string('make');
            $table->string('model');
            $table->integer('year');
            $table->enum('vehicle_type', ['commercial', 'light_vehicle', 'equipment']);
            $table->uuid('owner_id')->nullable();
            $table->uuid('yard_id')->nullable();
            $table->timestamps();
            
            $table->foreign('owner_id')->references('id')->on('users');
            $table->foreign('yard_id')->references('id')->on('yards');
            $table->index(['vehicle_type', 'make', 'model']);
            $table->index('registration_number');
        });
    }

    public function down()
    {
        Schema::dropIfExists('vehicles');
    }
};

