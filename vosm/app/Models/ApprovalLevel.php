<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'approval_request_id',
        'level',
        'approver_role',
        'approver_id',
        'required',
        'status',
        'notes',
        'approved_at'
    ];

    protected $casts = [
        'level' => 'integer',
        'required' => 'boolean',
        'approved_at' => 'datetime'
    ];

    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}

