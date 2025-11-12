<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add Capabilities to Users Table
 * 
 * Replaces single-role model with capability matrix (module-level + CRUD flags).
 * Capabilities are stored as JSON for flexibility.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            // Users table doesn't exist yet, skip
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            // Add capabilities JSON column
            $table->json('capabilities')->nullable()->after('role');
            
            // Keep role column for backward compatibility (can be removed later)
            // We'll migrate existing roles to capabilities
        });

        // Migrate existing roles to capabilities
        $this->migrateRolesToCapabilities();
    }

    /**
     * Migrate existing roles to capability matrix
     */
    private function migrateRolesToCapabilities(): void
    {
        $roleCapabilities = [
            'super_admin' => [
                'gate_pass' => ['create', 'read', 'update', 'delete', 'approve', 'validate'],
                'inspection' => ['create', 'read', 'update', 'delete', 'approve', 'review'],
                'expense' => ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
                'user_management' => ['create', 'read', 'update', 'delete'],
                'reports' => ['read', 'export'],
            ],
            'admin' => [
                'gate_pass' => ['create', 'read', 'update', 'delete', 'approve', 'validate'],
                'inspection' => ['create', 'read', 'update', 'delete', 'approve', 'review'],
                'expense' => ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
                'user_management' => ['read', 'update'],
                'reports' => ['read', 'export'],
            ],
            'supervisor' => [
                'gate_pass' => ['read', 'approve', 'validate'],
                'inspection' => ['read', 'approve', 'review'],
                'expense' => ['read', 'approve'],
                'user_management' => [],
                'reports' => ['read'],
            ],
            'inspector' => [
                'gate_pass' => ['read'],
                'inspection' => ['create', 'read', 'update'],
                'expense' => ['create', 'read'],
                'user_management' => [],
                'reports' => [],
            ],
            'guard' => [
                'gate_pass' => ['read', 'validate'],
                'inspection' => ['read'],
                'expense' => ['read'],
                'user_management' => [],
                'reports' => [],
            ],
            'clerk' => [
                'gate_pass' => ['create', 'read'],
                'inspection' => ['read'],
                'expense' => ['create', 'read'],
                'user_management' => [],
                'reports' => [],
            ],
        ];

        foreach ($roleCapabilities as $role => $capabilities) {
            \DB::table('users')
                ->where('role', $role)
                ->whereNull('capabilities')
                ->update([
                    'capabilities' => json_encode($capabilities),
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('capabilities');
        });
    }
};

