<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'question_id',
        'answer_value',
        'answer_files',
        'answer_metadata',
        'is_critical_finding'
    ];

    protected $casts = [
        'answer_files' => 'array',
        'answer_metadata' => 'array',
        'is_critical_finding' => 'boolean'
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(InspectionQuestion::class);
    }
}

