<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseEnrollment extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'enrollment_date',
        'status',
        'progress_percentage',
        'completion_date',
        'last_accessed',
        'final_score',
        'attempts_count',
        'module_progress',
        'test_scores',
        'notes',
    ];

    protected $casts = [
        'enrollment_date' => 'datetime',
        'completion_date' => 'datetime',
        'last_accessed' => 'datetime',
        'progress_percentage' => 'decimal:2',
        'final_score' => 'decimal:2',
        'module_progress' => 'array',
        'test_scores' => 'array',
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