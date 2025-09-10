<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnrollmentSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::whereIn('email', [
            'doctor@izamanagement.ro',
            'student@izamanagement.ro',
        ])->get()->keyBy('email');

        $courses = Course::get();

        foreach ($courses as $course) {
            // Enroll doctor
            if ($users->has('doctor@izamanagement.ro') && $course->isEnrollmentOpen()) {
                CourseEnrollment::updateOrCreate(
                    ['user_id' => $users['doctor@izamanagement.ro']->id, 'course_id' => $course->id],
                    [
                        'enrollment_date' => now()->subDays(2),
                        'status' => 'in_progress',
                        'progress_percentage' => 30,
                        'module_progress' => [
                            ['module' => 1, 'completed' => true],
                            ['module' => 2, 'completed' => false],
                            ['module' => 3, 'completed' => false],
                        ],
                    ]
                );
            }

            // Enroll student
            if ($users->has('student@izamanagement.ro') && $course->isEnrollmentOpen()) {
                CourseEnrollment::updateOrCreate(
                    ['user_id' => $users['student@izamanagement.ro']->id, 'course_id' => $course->id],
                    [
                        'enrollment_date' => now()->subDays(1),
                        'status' => 'enrolled',
                        'progress_percentage' => 0,
                        'module_progress' => [],
                    ]
                );
            }
        }
    }
}