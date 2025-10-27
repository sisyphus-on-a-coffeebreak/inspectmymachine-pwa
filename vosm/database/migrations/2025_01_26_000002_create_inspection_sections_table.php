<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inspection_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('order_index');
            $table->boolean('is_required')->default(true);
            $table->timestamps();
            
            $table->foreign('template_id')->references('id')->on('inspection_templates')->onDelete('cascade');
            $table->index(['template_id', 'order_index']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspection_sections');
    }
};

