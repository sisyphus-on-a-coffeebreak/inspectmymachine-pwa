<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpenseLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_id',
        'linked_type',
        'linked_id',
        'link_reason',
        'confidence_score'
    ];

    protected $casts = [
        'confidence_score' => 'decimal:2'
    ];

    /**
     * Get the expense that owns this link
     */
    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }

    /**
     * Get the linked item (polymorphic)
     */
    public function linkedItem()
    {
        // This would need to be implemented based on the linked_type
        // For now, we'll use a switch or match statement
        return match($this->linked_type) {
            'gate_pass', 'visitor_gate_pass' => $this->hasOne(VisitorGatePass::class, 'id', 'linked_id'),
            'vehicle_entry_pass' => $this->hasOne(VehicleEntryPass::class, 'id', 'linked_id'),
            'vehicle_exit_pass' => $this->hasOne(VehicleExitPass::class, 'id', 'linked_id'),
            'inspection' => $this->hasOne(Inspection::class, 'id', 'linked_id'),
            'stockyard_request' => $this->hasOne(StockyardRequest::class, 'id', 'linked_id'),
            default => null,
        };
    }
}

