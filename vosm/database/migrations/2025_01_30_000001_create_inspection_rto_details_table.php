<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspection_rto_details', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('inspection_id');
            $table->uuid('added_by'); // Back office executive who added the details
            
            // RTO Registration Details
            $table->string('rc_number')->nullable();
            $table->date('rc_issue_date')->nullable();
            $table->date('rc_expiry_date')->nullable();
            $table->string('rc_owner_name')->nullable();
            $table->string('rc_owner_address')->nullable();
            
            // Fitness Certificate
            $table->string('fitness_certificate_number')->nullable();
            $table->date('fitness_issue_date')->nullable();
            $table->date('fitness_expiry_date')->nullable();
            $table->enum('fitness_status', ['valid', 'expired', 'pending', 'not_applicable'])->nullable();
            
            // Permit Details
            $table->string('permit_number')->nullable();
            $table->date('permit_issue_date')->nullable();
            $table->date('permit_expiry_date')->nullable();
            $table->enum('permit_type', ['national', 'state', 'local', 'not_applicable'])->nullable();
            
            // Insurance Details
            $table->string('insurance_policy_number')->nullable();
            $table->string('insurance_company')->nullable();
            $table->date('insurance_issue_date')->nullable();
            $table->date('insurance_expiry_date')->nullable();
            $table->enum('insurance_type', ['third_party', 'comprehensive', 'not_applicable'])->nullable();
            
            // Tax Details
            $table->string('tax_certificate_number')->nullable();
            $table->date('tax_paid_date')->nullable();
            $table->date('tax_valid_until')->nullable();
            
            // Pollution Certificate (PUC)
            $table->string('puc_certificate_number')->nullable();
            $table->date('puc_issue_date')->nullable();
            $table->date('puc_expiry_date')->nullable();
            $table->enum('puc_status', ['valid', 'expired', 'pending', 'not_applicable'])->nullable();
            
            // Additional Notes
            $table->text('verification_notes')->nullable();
            $table->text('discrepancies')->nullable();
            
            // Status
            $table->enum('verification_status', ['pending', 'verified', 'discrepancy', 'rejected'])->default('pending');
            $table->uuid('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            
            $table->timestamps();
            
            $table->foreign('inspection_id')->references('id')->on('inspections')->onDelete('cascade');
            $table->foreign('added_by')->references('id')->on('users');
            $table->foreign('verified_by')->references('id')->on('users');
            $table->index(['inspection_id', 'verification_status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspection_rto_details');
    }
};

