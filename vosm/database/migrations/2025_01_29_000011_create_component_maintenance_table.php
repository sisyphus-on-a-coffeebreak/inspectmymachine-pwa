<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('component_maintenance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('component_type'); // 'battery', 'tyre', 'spare_part'
            $table->uuid('component_id');
            $table->string('maintenance_type'); // 'service', 'repair', 'replacement', 'inspection', 'cleaning'
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('performed_at');
            $table->date('next_due_date')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->uuid('performed_by')->nullable();
            $table->uuid('vendor_id')->nullable();
            $table->string('vendor_name')->nullable();
            $table->text('notes')->nullable();
            $table->json('attachments')->nullable(); // Array of file keys
            $table->timestamps();
            
            $table->foreign('performed_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['component_type', 'component_id']);
            $table->index('performed_at');
            $table->index('next_due_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('component_maintenance');
    }
};

