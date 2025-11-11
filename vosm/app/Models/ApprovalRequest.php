<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'pass_id',
        'pass_type',
        'requester_id',
        'approval_level',
        'current_approver_role',
        'status',
        'approval_notes',
        'rejection_reason',
        'escalation_reason',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at'
    ];

    protected $casts = [
        'approval_level' => 'integer',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime'
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function levels(): HasMany
    {
        return $this->hasMany(ApprovalLevel::class, 'approval_request_id');
    }

    public function getPassAttribute()
    {
        if ($this->pass_type === 'visitor') {
            // Assuming there's a VisitorGatePass model
            // return VisitorGatePass::find($this->pass_id);
            return null; // Will be implemented when gate pass models exist
        } else {
            // Assuming there's a VehicleEntryPass or VehicleExitPass model
            // return VehicleEntryPass::find($this->pass_id) ?? VehicleExitPass::find($this->pass_id);
            return null; // Will be implemented when gate pass models exist
        }
    }
}

