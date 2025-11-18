<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('expense_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('expense_id');
            $table->string('linked_type'); // 'gate_pass', 'inspection', 'stockyard_request', 'visitor_gate_pass', 'vehicle_entry_pass', 'vehicle_exit_pass'
            $table->uuid('linked_id');
            $table->string('link_reason'); // 'same_vehicle', 'same_date', 'keyword_match', 'same_project'
            $table->decimal('confidence_score', 3, 2)->default(0.5); // 0.00 to 1.00
            $table->timestamps();
            
            $table->foreign('expense_id')->references('id')->on('expenses')->onDelete('cascade');
            $table->index(['linked_type', 'linked_id']);
            $table->index(['expense_id', 'linked_type']);
            $table->unique(['expense_id', 'linked_type', 'linked_id']); // Prevent duplicate links
        });
    }

    public function down()
    {
        Schema::dropIfExists('expense_links');
    }
};


