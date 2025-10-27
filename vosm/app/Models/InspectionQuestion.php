<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'section_id',
        'question_text',
        'question_type',
        'is_required',
        'is_critical',
        'order_index',
        'validation_rules',
        'conditional_logic',
        'help_text'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_critical' => 'boolean',
        'validation_rules' => 'array',
        'conditional_logic' => 'array'
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(InspectionSection::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(InspectionQuestionOption::class)->orderBy('order_index');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(InspectionAnswer::class);
    }
}

