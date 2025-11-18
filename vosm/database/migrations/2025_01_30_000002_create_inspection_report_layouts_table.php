<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspection_report_layouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('inspection_id');
            $table->uuid('created_by');
            
            // Layout configuration (JSON)
            $table->json('layout_config'); // Stores the draggable layout configuration
            $table->json('section_order'); // Order of sections
            $table->json('visible_sections'); // Which sections to show/hide
            
            // Report metadata
            $table->string('report_title')->nullable();
            $table->text('report_footer')->nullable();
            $table->boolean('include_company_logo')->default(true);
            $table->boolean('include_signatures')->default(true);
            $table->boolean('include_photos')->default(true);
            
            $table->boolean('is_default')->default(false); // Default layout for this inspection
            $table->timestamps();
            
            $table->foreign('inspection_id')->references('id')->on('inspections')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['inspection_id', 'is_default']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspection_report_layouts');
    }
};


