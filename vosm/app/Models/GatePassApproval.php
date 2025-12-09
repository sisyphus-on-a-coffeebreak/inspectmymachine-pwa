<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GatePassApproval extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'gate_pass_id',
        'requester_id',
        'requester_name',
        'approval_level',
        'current_approver_id',
        'current_approver_role',
        'status',
        'approval_notes',
        'rejection_reason',
        'escalation_reason',
        'requested_at',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function gatePass(): BelongsTo
    {
        return $this->belongsTo(GatePass::class, 'gate_pass_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function currentApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_approver_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(GatePassApprovalComment::class, 'approval_id');
    }
}




