<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pass_id')->notNull();
            $table->enum('pass_type', ['visitor', 'vehicle'])->notNull();
            $table->uuid('requester_id')->notNull();
            $table->integer('approval_level')->default(1);
            $table->string('current_approver_role', 50)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'escalated'])->default('pending');
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('escalation_reason')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
            
            $table->foreign('requester_id')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
            $table->foreign('rejected_by')->references('id')->on('users');
            $table->index(['status', 'created_at']);
            $table->index(['requester_id', 'created_at']);
            $table->index(['pass_id', 'pass_type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('approval_requests');
    }
};

