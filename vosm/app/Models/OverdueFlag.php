<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class OverdueFlag extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_type',
        'item_id',
        'reason',
        'description',
        'flagged_at',
        'resolved_at',
        'resolved_by'
    ];

    protected $casts = [
        'flagged_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Scope to get unresolved flags
     */
    public function scopeUnresolved($query)
    {
        return $query->whereNull('resolved_at');
    }

    /**
     * Scope to filter by item type
     */
    public function scopeItemType($query, string $itemType)
    {
        return $query->where('item_type', $itemType);
    }

    /**
     * Scope to filter by reason
     */
    public function scopeReason($query, string $reason)
    {
        return $query->where('reason', $reason);
    }
}

