<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseReview;
use App\Models\MedicalCondition;
use App\Models\MedicalConditionReview;
use App\Models\User;
use App\Models\UserBookmark;
use Illuminate\Database\Seeder;

class ReviewAndBookmarkSeeder extends Seeder
{
    public function run(): void
    {
        $doctor = User::where('email', 'doctor@izamanagement.ro')->first();
        $student = User::where('email', 'student@izamanagement.ro')->first();

        // Reviews for courses
        $course = Course::first();
        if ($course && $doctor) {
            CourseReview::updateOrCreate(
                ['course_id' => $course->id, 'user_id' => $doctor->id],
                ['rating' => 5, 'comment' => 'Excelent, foarte aplicat clinic!']
            );
        }

        if ($course && $student) {
            CourseReview::updateOrCreate(
                ['course_id' => $course->id, 'user_id' => $student->id],
                ['rating' => 4, 'comment' => 'Explicații clare și exemple bune.']
            );
        }

        // Reviews and bookmarks for conditions
        $condition = MedicalCondition::where('name', 'Diabet zaharat tip 2')->first();
        if ($condition && $doctor) {
            MedicalConditionReview::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'user_id' => $doctor->id],
                ['rating' => 5, 'comment' => 'Informație actualizată și foarte utilă.']
            );
            UserBookmark::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'user_id' => $doctor->id],
                []
            );
        }
    }
}