<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'name',
        'description',
        'order_index',
        'is_required'
    ];

    protected $casts = [
        'is_required' => 'boolean'
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(InspectionQuestion::class)->orderBy('order_index');
    }
}

