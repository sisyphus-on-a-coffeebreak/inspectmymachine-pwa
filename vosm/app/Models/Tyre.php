<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tyre extends Model
{
    use HasFactory;

    protected $fillable = [
        'serial_number',
        'brand',
        'model',
        'size',
        'tread_depth_mm',
        'purchase_date',
        'warranty_expires_at',
        'purchase_cost',
        'current_vehicle_id',
        'position',
        'status',
        'notes'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expires_at' => 'date',
        'purchase_cost' => 'decimal:2',
        'tread_depth_mm' => 'integer'
    ];

    public function currentVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'current_vehicle_id');
    }

    public function custodyHistory(): HasMany
    {
        return $this->hasMany(ComponentCustodyHistory::class, 'component_id')
            ->where('component_type', 'tyre')
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

    /**
     * Check if tread depth is low (needs replacement)
     */
    public function needsReplacement(): bool
    {
        // Generally, tyres need replacement when tread depth is below 1.6mm (legal minimum)
        return $this->tread_depth_mm !== null && $this->tread_depth_mm < 1.6;
    }
}


