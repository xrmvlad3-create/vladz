<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certification extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'certificate_number',
        'issue_date',
        'expiry_date',
        'cme_credits_earned',
        'cpe_credits_earned',
        'verification_code',
        'status',
        'certificate_path',
        'metadata',
    ];

    protected $casts = [
        'issue_date' => 'datetime',
        'expiry_date' => 'datetime',
        'metadata' => 'array',
        'cme_credits_earned' => 'decimal:2',
        'cpe_credits_earned' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}