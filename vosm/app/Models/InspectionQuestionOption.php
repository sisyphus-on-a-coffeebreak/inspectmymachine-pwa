<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionQuestionOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'option_text',
        'option_value',
        'order_index',
        'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean'
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(InspectionQuestion::class);
    }
}

