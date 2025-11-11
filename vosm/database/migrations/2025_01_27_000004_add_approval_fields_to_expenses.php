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
                $table->uuid('approved_by')->nullable()->after('status');
                $table->timestamp('approved_at')->nullable()->after('approved_by');
                $table->uuid('rejected_by')->nullable()->after('approved_at');
                $table->timestamp('rejected_at')->nullable()->after('rejected_by');
                $table->text('rejection_reason')->nullable()->after('rejected_at');
                
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('rejected_by')->references('id')->on('users')->onDelete('set null');
                $table->index('status');
                $table->index('approved_at');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropForeign(['approved_by']);
                $table->dropForeign(['rejected_by']);
                $table->dropIndex(['status']);
                $table->dropIndex(['approved_at']);
                $table->dropColumn(['approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason']);
            });
        }
    }
};

