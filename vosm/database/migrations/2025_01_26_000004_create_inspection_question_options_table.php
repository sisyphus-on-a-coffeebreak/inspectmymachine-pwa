<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspection_question_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('question_id');
            $table->string('option_text');
            $table->string('option_value');
            $table->integer('order_index');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            $table->foreign('question_id')->references('id')->on('inspection_questions')->onDelete('cascade');
            $table->index(['question_id', 'order_index']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspection_question_options');
    }
};

