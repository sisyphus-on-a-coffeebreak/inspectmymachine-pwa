<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionRtoDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'added_by',
        'rc_number',
        'rc_issue_date',
        'rc_expiry_date',
        'rc_owner_name',
        'rc_owner_address',
        'fitness_certificate_number',
        'fitness_issue_date',
        'fitness_expiry_date',
        'fitness_status',
        'permit_number',
        'permit_issue_date',
        'permit_expiry_date',
        'permit_type',
        'insurance_policy_number',
        'insurance_company',
        'insurance_issue_date',
        'insurance_expiry_date',
        'insurance_type',
        'tax_certificate_number',
        'tax_paid_date',
        'tax_valid_until',
        'puc_certificate_number',
        'puc_issue_date',
        'puc_expiry_date',
        'puc_status',
        'show_rc_details',
        'show_fitness',
        'show_permit',
        'show_insurance',
        'show_tax',
        'show_puc',
        'verification_notes',
        'discrepancies',
        'verification_status',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'rc_issue_date' => 'date',
        'rc_expiry_date' => 'date',
        'fitness_issue_date' => 'date',
        'fitness_expiry_date' => 'date',
        'permit_issue_date' => 'date',
        'permit_expiry_date' => 'date',
        'insurance_issue_date' => 'date',
        'insurance_expiry_date' => 'date',
        'tax_paid_date' => 'date',
        'tax_valid_until' => 'date',
        'puc_issue_date' => 'date',
        'puc_expiry_date' => 'date',
        'verified_at' => 'datetime',
        'show_rc_details' => 'boolean',
        'show_fitness' => 'boolean',
        'show_permit' => 'boolean',
        'show_insurance' => 'boolean',
        'show_tax' => 'boolean',
        'show_puc' => 'boolean',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}

