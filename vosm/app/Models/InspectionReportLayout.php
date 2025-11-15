<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionReportLayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'created_by',
        'layout_config',
        'section_order',
        'visible_sections',
        'report_title',
        'report_footer',
        'include_company_logo',
        'include_signatures',
        'include_photos',
        'is_default',
    ];

    protected $casts = [
        'layout_config' => 'array',
        'section_order' => 'array',
        'visible_sections' => 'array',
        'include_company_logo' => 'boolean',
        'include_signatures' => 'boolean',
        'include_photos' => 'boolean',
        'is_default' => 'boolean',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

