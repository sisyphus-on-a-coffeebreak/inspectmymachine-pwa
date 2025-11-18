<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inspection_answers', function (Blueprint $table) {
            $table->string('component_type')->nullable()->after('question_id'); // 'battery', 'tyre', 'spare_part'
            $table->uuid('component_id')->nullable()->after('component_type');
            
            $table->index(['component_type', 'component_id']);
        });
    }

    public function down()
    {
        Schema::table('inspection_answers', function (Blueprint $table) {
            $table->dropIndex(['component_type', 'component_id']);
            $table->dropColumn(['component_type', 'component_id']);
        });
    }
};


