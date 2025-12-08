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
        Schema::create('gate_pass_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Link to gate pass
            $table->uuid('gate_pass_id');
            $table->foreign('gate_pass_id')->references('id')->on('gate_passes')->onDelete('cascade');
            
            // Requester information
            $table->unsignedBigInteger('requester_id');
            $table->foreign('requester_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('requester_name');
            
            // Approval workflow
            $table->unsignedTinyInteger('approval_level')->default(1); // 1, 2, 3, etc.
            $table->unsignedBigInteger('current_approver_id')->nullable();
            $table->foreign('current_approver_id')->references('id')->on('users')->onDelete('set null');
            $table->string('current_approver_role')->nullable();
            
            // Status
            $table->enum('status', ['pending', 'approved', 'rejected', 'escalated'])->default('pending');
            
            // Approval details
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('escalation_reason')->nullable();
            
            // Timestamps
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('gate_pass_id');
            $table->index('requester_id');
            $table->index('current_approver_id');
            $table->index('status');
            $table->index('approval_level');
        });
        
        // Create approval comments table
        Schema::create('gate_pass_approval_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Link to approval
            $table->uuid('approval_id');
            $table->foreign('approval_id')->references('id')->on('gate_pass_approvals')->onDelete('cascade');
            
            // Comment author
            $table->unsignedBigInteger('author_id');
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('author_name');
            $table->string('author_role')->nullable();
            
            // Comment content
            $table->text('content');
            $table->json('mentions')->nullable(); // Array of user IDs mentioned
            
            // Threading support
            $table->uuid('parent_id')->nullable();
            $table->foreign('parent_id')->references('id')->on('gate_pass_approval_comments')->onDelete('cascade');
            
            $table->timestamps();
            
            // Indexes
            $table->index('approval_id');
            $table->index('author_id');
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gate_pass_approval_comments');
        Schema::dropIfExists('gate_pass_approvals');
    }
};


