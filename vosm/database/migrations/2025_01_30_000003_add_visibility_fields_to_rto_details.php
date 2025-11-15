<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inspection_rto_details', function (Blueprint $table) {
            // Add visibility flags for each RTO section
            $table->boolean('show_rc_details')->default(true)->after('rc_owner_address');
            $table->boolean('show_fitness')->default(true)->after('fitness_status');
            $table->boolean('show_permit')->default(true)->after('permit_type');
            $table->boolean('show_insurance')->default(true)->after('insurance_type');
            $table->boolean('show_tax')->default(true)->after('tax_valid_until');
            $table->boolean('show_puc')->default(true)->after('puc_status');
        });
    }

    public function down()
    {
        Schema::table('inspection_rto_details', function (Blueprint $table) {
            $table->dropColumn([
                'show_rc_details',
                'show_fitness',
                'show_permit',
                'show_insurance',
                'show_tax',
                'show_puc',
            ]);
        });
    }
};

