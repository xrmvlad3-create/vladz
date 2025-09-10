<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Test;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $instructor = User::whereHas('roles', fn($q) => $q->where('name', 'professor'))->first()
            ?? User::first();

        $courses = [
            [
                'title' => 'Interpretarea ECG în urgență',
                'description' => 'Curs intensiv pentru interpretarea ECG în contextul urgențelor cardiace.',
                'category' => 'cardiology',
                'difficulty_level' => 'intermediate',
                'duration_hours' => 8,
                'max_participants' => 200,
                'prerequisites' => ['Noțiuni de bază ECG', 'Fiziologie cardiacă'],
                'learning_objectives' => [
                    'Identificarea ritmurilor letale',
                    'Recunoașterea STEMI/NSTEMI',
                    'Identificarea tulburărilor de conducere'
                ],
                'course_content' => [
                    'Bazele ECG', 'Aritmii', 'Sindroame coronariene', 'Cazuri clinice'
                ],
                'assessment_criteria' => ['Test final 30 întrebări', 'Studii de caz'],
                'certification_type' => 'cme',
                'cme_credits' => 8,
                'cpe_credits' => null,
                'price' => 0,
                'discount_percentage' => null,
                'status' => 'published',
                'start_date' => now()->addDays(7),
                'end_date' => now()->addDays(14),
                'registration_deadline' => now()->addDays(5),
                'language' => 'ro',
                'timezone' => 'Europe/Bucharest',
                'is_featured' => true,
                'is_free' => true,
                'requires_approval' => false,
                'completion_rate_threshold' => 80,
                'passing_score' => 70,
                'max_attempts' => 3,
                'tags' => ['ECG','urgență','cardiologie'],
                'target_audience' => ['Rezidenți', 'Medici Urgență', 'Cardiologi'],
                'accreditation_body' => 'Colegiul Medicilor din România',
                'accreditation_number' => 'CME-2025-0001',
                'contact_hours' => 8,
                'practical_hours' => 2,
                'theory_hours' => 6,
            ],
            [
                'title' => 'Managementul pacientului cu diabet tip 2',
                'description' => 'Abordare modernă a îngrijirii pacientului cu DZ tip 2, cu accent pe rezultate clinice.',
                'category' => 'endocrinology',
                'difficulty_level' => 'beginner',
                'duration_hours' => 10,
                'max_participants' => 300,
                'prerequisites' => ['Bazele fiziologiei', 'Farmacologie de bază'],
                'learning_objectives' => [
                    'Algoritmi de tratament 2025',
                    'Medicație GLP-1/SGLT2',
                    'Management complicații'
                ],
                'course_content' => ['Diagnostic', 'Tratament', 'Complicații', 'Cazuri'],
                'assessment_criteria' => ['Test final', 'Mini-OSCE'],
                'certification_type' => 'cme',
                'cme_credits' => 10,
                'cpe_credits' => null,
                'price' => 199,
                'discount_percentage' => 20,
                'status' => 'published',
                'start_date' => now()->addDays(10),
                'end_date' => now()->addDays(25),
                'registration_deadline' => now()->addDays(9),
                'language' => 'ro',
                'timezone' => 'Europe/Bucharest',
                'is_featured' => false,
                'is_free' => false,
                'requires_approval' => false,
                'completion_rate_threshold' => 80,
                'passing_score' => 70,
                'max_attempts' => 3,
                'tags' => ['diabet','metabolism','cme'],
                'target_audience' => ['Medici familie', 'Interniști', 'Rezidenți'],
                'accreditation_body' => 'CMR',
                'accreditation_number' => 'CME-2025-0002',
                'contact_hours' => 6,
                'practical_hours' => 2,
                'theory_hours' => 2,
            ],
            [
                'title' => 'Ventilație non-invazivă în BPOC acut',
                'description' => 'Curs practic despre utilizarea NIV în exacerbările BPOC.',
                'category' => 'pulmonology',
                'difficulty_level' => 'advanced',
                'duration_hours' => 6,
                'max_participants' => 100,
                'prerequisites' => ['Fiziologie respiratorie', 'Bazele ventilării'],
                'learning_objectives' => [
                    'Indicații și contraindicații NIV',
                    'Parametri NIV și titrare',
                    'Monitorizare și complicații'
                ],
                'course_content' => ['Fiziologie', 'Setări NIV', 'Cazuri'],
                'assessment_criteria' => ['Test final', 'Checklist practic'],
                'certification_type' => 'completion',
                'cme_credits' => 0,
                'cpe_credits' => 4,
                'price' => 149,
                'discount_percentage' => null,
                'status' => 'published',
                'start_date' => now()->addDays(20),
                'end_date' => now()->addDays(26),
                'registration_deadline' => now()->addDays(18),
                'language' => 'ro',
                'timezone' => 'Europe/Bucharest',
                'is_featured' => true,
                'is_free' => false,
                'requires_approval' => true,
                'completion_rate_threshold' => 80,
                'passing_score' => 70,
                'max_attempts' => 2,
                'tags' => ['BPOC','NIV','urgență'],
                'target_audience' => ['ATI', 'Urgență', 'Pneumologie'],
                'accreditation_body' => null,
                'accreditation_number' => null,
                'contact_hours' => 4,
                'practical_hours' => 2,
                'theory_hours' => 0,
            ],
        ];

        foreach ($courses as $c) {
            $course = Course::updateOrCreate(
                ['title' => $c['title']],
                [
                    ...$c,
                    'instructor_id' => $instructor?->id,
                ]
            );

            // Modules
            $modulesData = [
                ['Intro și bazele teoretice', 60],
                ['Studii de caz', 120],
                ['Evaluare finală', 30],
            ];
            foreach ($modulesData as $idx => [$title, $minutes]) {
                CourseModule::updateOrCreate(
                    ['course_id' => $course->id, 'order_index' => $idx + 1],
                    [
                        'title' => $title,
                        'description' => $title,
                        'duration_minutes' => $minutes,
                        'is_mandatory' => true
                    ]
                );
            }

            // Test
            Test::updateOrCreate(
                ['course_id' => $course->id, 'title' => 'Test final'],
                [
                    'description' => 'Întrebări grilă standardizate',
                    'passing_score' => $course->passing_score,
                    'time_limit_minutes' => 30,
                    'max_attempts' => $course->max_attempts,
                    'is_required' => true,
                    'questions' => [
                        ['q' => 'Întrebare 1', 'a' => ['a','b','c','d'], 'c' => 1],
                        ['q' => 'Întrebare 2', 'a' => ['a','b','c','d'], 'c' => 2],
                        ['q' => 'Întrebare 3', 'a' => ['a','b','c','d'], 'c' => 3],
                    ]
                ]
            );
        }
    }
}