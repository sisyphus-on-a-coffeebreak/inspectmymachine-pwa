<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Inspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'vehicle_id',
        'inspector_id',
        'reviewer_id',
        'status',
        'overall_rating',
        'pass_fail',
        'has_critical_issues',
        'duration_minutes',
        'started_at',
        'completed_at',
        'reviewed_at',
        'inspector_notes',
        'reviewer_notes'
    ];

    protected $casts = [
        'overall_rating' => 'decimal:1',
        'has_critical_issues' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'reviewed_at' => 'datetime'
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(InspectionAnswer::class);
    }

    public function getCriticalAnswers()
    {
        return $this->answers()->where('is_critical_finding', true)->get();
    }

    public function rtoDetails(): HasOne
    {
        return $this->hasOne(InspectionRtoDetail::class);
    }

    public function reportLayouts(): HasMany
    {
        return $this->hasMany(InspectionReportLayout::class);
    }

    public function defaultReportLayout(): HasOne
    {
        return $this->hasOne(InspectionReportLayout::class)->where('is_default', true);
    }
}

