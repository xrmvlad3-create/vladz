<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'user_id',
        'course_id',
        'score',
        'status',
        'answers',
        'started_at',
        'completed_at',
        'duration_seconds',
        'attempt_number'
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'answers' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'duration_seconds' => 'integer',
        'attempt_number' => 'integer'
    ];

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}