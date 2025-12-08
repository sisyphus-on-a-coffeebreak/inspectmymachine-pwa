<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('report_branding', function (Blueprint $table) {
            $table->id();
            
            // Logo
            $table->string('logo_url')->nullable();
            $table->string('logo_path')->nullable(); // Storage path
            
            // Company Details
            $table->string('company_name');
            $table->string('trading_as')->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('gstin')->nullable();
            
            // Colors
            $table->string('primary_color')->default('#2563eb');
            $table->string('secondary_color')->default('#1e40af');
            
            // Options
            $table->boolean('show_logo_in_header')->default(true);
            $table->boolean('show_address_in_header')->default(true);
            $table->boolean('show_contact_in_footer')->default(true);
            $table->boolean('add_watermark_to_photos')->default(false);
            $table->boolean('include_qr_code')->default(false);
            
            // Footer
            $table->text('footer_text')->nullable();
            
            // Metadata
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            
            $table->timestamps();
            
            // Only one branding record should exist
            $table->unique('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_branding');
    }
};
