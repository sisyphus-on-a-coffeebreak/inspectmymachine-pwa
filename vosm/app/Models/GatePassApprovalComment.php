<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GatePassApprovalComment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'approval_id',
        'author_id',
        'author_name',
        'author_role',
        'content',
        'mentions',
        'parent_id',
    ];

    protected $casts = [
        'mentions' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function approval(): BelongsTo
    {
        return $this->belongsTo(GatePassApproval::class, 'approval_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(GatePassApprovalComment::class, 'parent_id');
    }

    public function replies(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(GatePassApprovalComment::class, 'parent_id');
    }
}




