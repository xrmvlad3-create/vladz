<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'passing_score',
        'time_limit_minutes',
        'max_attempts',
        'is_required',
        'questions'
    ];

    protected $casts = [
        'passing_score' => 'decimal:2',
        'time_limit_minutes' => 'integer',
        'max_attempts' => 'integer',
        'is_required' => 'boolean',
        'questions' => 'array'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function attempts()
    {
        return $this->hasMany(TestAttempt::class);
    }
}