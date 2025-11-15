<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->timestamp('escalated_at')->nullable()->after('rejection_reason');
                $table->uuid('escalated_to')->nullable()->after('escalated_at');
                $table->integer('escalation_level')->default(0)->after('escalated_to'); // 0 = not escalated, 1 = first escalation, 2 = second, etc.
                
                $table->foreign('escalated_to')->references('id')->on('users')->onDelete('set null');
                $table->index('escalated_at');
                $table->index('escalation_level');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropForeign(['escalated_to']);
                $table->dropIndex(['escalated_at']);
                $table->dropIndex(['escalation_level']);
                $table->dropColumn(['escalated_at', 'escalated_to', 'escalation_level']);
            });
        }
    }
};

