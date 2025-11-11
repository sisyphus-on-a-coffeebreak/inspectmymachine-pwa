<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('approval_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('approval_request_id')->notNull();
            $table->integer('level')->notNull();
            $table->string('approver_role', 50)->notNull();
            $table->uuid('approver_id')->nullable();
            $table->boolean('required')->default(true);
            $table->enum('status', ['pending', 'approved', 'rejected', 'skipped'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->foreign('approval_request_id')->references('id')->on('approval_requests')->onDelete('cascade');
            $table->foreign('approver_id')->references('id')->on('users');
            $table->index(['approval_request_id', 'level']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('approval_levels');
    }
};

