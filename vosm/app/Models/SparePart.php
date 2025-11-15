<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SparePart extends Model
{
    use HasFactory;

    protected $fillable = [
        'part_number',
        'name',
        'category',
        'brand',
        'model',
        'purchase_date',
        'warranty_expires_at',
        'purchase_cost',
        'current_vehicle_id',
        'status',
        'notes'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expires_at' => 'date',
        'purchase_cost' => 'decimal:2'
    ];

    public function currentVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'current_vehicle_id');
    }

    public function custodyHistory(): HasMany
    {
        return $this->hasMany(ComponentCustodyHistory::class, 'component_id')
            ->where('component_type', 'spare_part')
            ->orderBy('transferred_at', 'desc');
    }

    /**
     * Check if warranty is expired
     */
    public function isWarrantyExpired(): bool
    {
        return $this->warranty_expires_at && $this->warranty_expires_at->isPast();
    }

    /**
     * Check if warranty expires soon (within 30 days)
     */
    public function isWarrantyExpiringSoon(): bool
    {
        if (!$this->warranty_expires_at) {
            return false;
        }
        
        return $this->warranty_expires_at->isFuture() 
            && $this->warranty_expires_at->diffInDays(now()) <= 30;
    }
}

