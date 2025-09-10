<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalConditionReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'medical_condition_id',
        'user_id',
        'rating',
        'comment'
    ];

    protected $casts = [
        'rating' => 'integer'
    ];

    public function medicalCondition()
    {
        return $this->belongsTo(MedicalCondition::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}