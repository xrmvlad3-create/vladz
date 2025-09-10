<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'duration_minutes',
        'order_index',
        'is_mandatory'
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'order_index' => 'integer',
        'is_mandatory' => 'boolean'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}