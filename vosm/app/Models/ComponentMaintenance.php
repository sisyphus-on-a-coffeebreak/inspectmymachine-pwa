<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponentMaintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'component_type',
        'component_id',
        'maintenance_type',
        'title',
        'description',
        'performed_at',
        'next_due_date',
        'cost',
        'performed_by',
        'vendor_id',
        'vendor_name',
        'notes',
        'attachments',
    ];

    protected $casts = [
        'performed_at' => 'date',
        'next_due_date' => 'date',
        'cost' => 'decimal:2',
        'attachments' => 'array',
    ];

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
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


