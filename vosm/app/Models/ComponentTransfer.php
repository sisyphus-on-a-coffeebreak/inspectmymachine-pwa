<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponentTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'component_type',
        'component_id',
        'from_vehicle_id',
        'to_vehicle_id',
        'requested_by',
        'approved_by',
        'status',
        'reason',
        'rejection_reason',
        'requested_at',
        'approved_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function fromVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'from_vehicle_id');
    }

    public function toVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'to_vehicle_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the component model based on component_type
     */
    public function component()
    {
        $modelClass = match($this->component_type) {
            'battery' => Battery::class,
            'tyre' => Tyre::class,
            'spare_part' => SparePart::class,
            default => null
        };

        if (!$modelClass) {
            return null;
        }

        return $modelClass::find($this->component_id);
    }
}


