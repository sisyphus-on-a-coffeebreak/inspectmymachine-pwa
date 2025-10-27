<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->uuid('vehicle_id');
            $table->uuid('inspector_id');
            $table->uuid('reviewer_id')->nullable();
            $table->enum('status', [
                'draft', 'in_progress', 'completed', 'under_review', 
                'approved', 'rejected', 'archived'
            ])->default('draft');
            $table->decimal('overall_rating', 2, 1)->nullable();
            $table->enum('pass_fail', ['pass', 'fail', 'conditional'])->nullable();
            $table->boolean('has_critical_issues')->default(false);
            $table->integer('duration_minutes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('inspector_notes')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamps();
            
            $table->foreign('template_id')->references('id')->on('inspection_templates');
            $table->foreign('vehicle_id')->references('id')->on('vehicles');
            $table->foreign('inspector_id')->references('id')->on('users');
            $table->foreign('reviewer_id')->references('id')->on('users');
            $table->index(['status', 'created_at']);
            $table->index(['inspector_id', 'created_at']);
            $table->index(['vehicle_id', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspections');
    }
};

