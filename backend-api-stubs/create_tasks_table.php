<?php

/**
 * Database Migration: Create Tasks Table
 * 
 * Run: php artisan make:migration create_tasks_table
 * Then copy this content to the generated migration file
 */

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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('custom'); // clerking_sheet, component_accounting, etc.
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled, overdue
            $table->string('priority')->default('medium'); // low, medium, high, critical
            $table->foreignId('assigned_to_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('created_by_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('due_date')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->json('metadata')->nullable(); // Type-specific data
            $table->string('related_entity_type')->nullable(); // vehicle, expense, inspection, etc.
            $table->string('related_entity_id')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index('assigned_to_id');
            $table->index('created_by_id');
            $table->index('status');
            $table->index('priority');
            $table->index('type');
            $table->index(['related_entity_type', 'related_entity_id']);
        });

        // Task assignments history
        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('assigned_to_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_by_id')->constrained('users')->onDelete('cascade');
            $table->text('reason')->nullable();
            $table->timestamp('assigned_at');
            
            $table->index('task_id');
            $table->index('assigned_to_id');
        });

        // Task comments
        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
            
            $table->index('task_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('task_assignments');
        Schema::dropIfExists('tasks');
    }
};



