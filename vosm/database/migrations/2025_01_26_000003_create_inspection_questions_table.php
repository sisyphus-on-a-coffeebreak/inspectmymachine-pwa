<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspection_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('section_id');
            $table->text('question_text');
            $table->enum('question_type', [
                'text', 'number', 'date', 'yesno', 'dropdown', 'slider', 
                'camera', 'audio', 'signature', 'multiselect', 'geolocation'
            ]);
            $table->boolean('is_required')->default(false);
            $table->boolean('is_critical')->default(false);
            $table->integer('order_index');
            $table->json('validation_rules')->nullable();
            $table->json('conditional_logic')->nullable();
            $table->text('help_text')->nullable();
            $table->timestamps();
            
            $table->foreign('section_id')->references('id')->on('inspection_sections')->onDelete('cascade');
            $table->index(['section_id', 'order_index']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspection_questions');
    }
};

