<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspection_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('inspection_id');
            $table->uuid('question_id');
            $table->text('answer_value')->nullable();
            $table->json('answer_files')->nullable(); // [{type: "image", url: "s3://...", size: 1024}]
            $table->json('answer_metadata')->nullable(); // {coordinates: {lat, lng}, signature_data: "base64"}
            $table->boolean('is_critical_finding')->default(false);
            $table->timestamps();
            
            $table->foreign('inspection_id')->references('id')->on('inspections')->onDelete('cascade');
            $table->foreign('question_id')->references('id')->on('inspection_questions');
            $table->unique(['inspection_id', 'question_id']);
            $table->index(['inspection_id', 'is_critical_finding']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspection_answers');
    }
};

