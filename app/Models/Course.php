<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Course extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'title', 'description', 'instructor_id', 'category', 'difficulty_level',
        'duration_hours', 'max_participants', 'prerequisites', 'learning_objectives',
        'course_content', 'assessment_criteria', 'certification_type', 'cme_credits',
        'cpe_credits', 'price', 'currency', 'discount_percentage', 'status', 
        'start_date', 'end_date', 'registration_deadline', 'language', 'timezone',
        'is_featured', 'is_free', 'requires_approval', 'completion_rate_threshold',
        'passing_score', 'max_attempts', 'certificate_template', 'tags',
        'target_audience', 'accreditation_body', 'accreditation_number',
        'contact_hours', 'practical_hours', 'theory_hours', 'version'
    ];

    protected $casts = [
        'prerequisites' => 'array',
        'learning_objectives' => 'array',
        'course_content' => 'array',
        'assessment_criteria' => 'array',
        'tags' => 'array',
        'target_audience' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'registration_deadline' => 'datetime',
        'price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'cme_credits' => 'decimal:2',
        'cpe_credits' => 'decimal:2',
        'completion_rate_threshold' => 'decimal:2',
        'passing_score' => 'decimal:2',
        'duration_hours' => 'decimal:2',
        'contact_hours' => 'decimal:2',
        'practical_hours' => 'decimal:2',
        'theory_hours' => 'decimal:2',
        'version' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_free' => 'boolean',
        'requires_approval' => 'boolean'
    ];

    protected $attributes = [
        'status' => 'draft',
        'language' => 'ro',
        'currency' => 'RON',
        'timezone' => 'Europe/Bucharest',
        'difficulty_level' => 'beginner',
        'completion_rate_threshold' => 80.0,
        'passing_score' => 70.0,
        'max_attempts' => 3,
        'version' => 1.0
    ];

    // Relationships
    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function enrollments()
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function modules()
    {
        return $this->hasMany(CourseModule::class)->orderBy('order_index');
    }

    public function tests()
    {
        return $this->hasMany(Test::class);
    }

    public function certifications()
    {
        return $this->hasMany(Certification::class);
    }

    public function reviews()
    {
        return $this->hasMany(CourseReview::class);
    }

    public function announcements()
    {
        return $this->hasMany(CourseAnnouncement::class);
    }

    public function discussions()
    {
        return $this->hasMany(CourseDiscussion::class);
    }

    public function resources()
    {
        return $this->hasMany(CourseResource::class);
    }

    public function assignments()
    {
        return $this->hasMany(CourseAssignment::class);
    }

    public function categories()
    {
        return $this->belongsToMany(CourseCategory::class);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'published')
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                          ->orWhere('end_date', '>', now());
                    });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeFree($query)
    {
        return $query->where('is_free', true)->orWhere('price', 0);
    }

    public function scopePaid($query)
    {
        return $query->where('is_free', false)->where('price', '>', 0);
    }

    public function scopeByDifficulty($query, $level)
    {
        return $query->where('difficulty_level', $level);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByInstructor($query, $instructorId)
    {
        return $query->where('instructor_id', $instructorId);
    }

    public function scopeWithCmeCredits($query)
    {
        return $query->where('cme_credits', '>', 0);
    }

    // Search configuration
    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'difficulty_level' => $this->difficulty_level,
            'instructor_name' => $this->instructor->name ?? '',
            'tags' => $this->tags,
            'target_audience' => $this->target_audience,
            'status' => $this->status
        ];
    }

    // Accessors
    public function getEnrollmentCountAttribute()
    {
        return $this->enrollments()->count();
    }

    public function getActiveEnrollmentCountAttribute()
    {
        return $this->enrollments()->whereIn('status', ['enrolled', 'in_progress'])->count();
    }

    public function getCompletionCountAttribute()
    {
        return $this->enrollments()->where('status', 'completed')->count();
    }

    public function getAverageRatingAttribute()
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    public function getTotalRatingsAttribute()
    {
        return $this->reviews()->count();
    }

    public function getCompletionRateAttribute()
    {
        $total = $this->enrollments()->count();
        if ($total === 0) return 0;

        $completed = $this->enrollments()->where('status', 'completed')->count();
        return ($completed / $total) * 100;
    }

    public function getCurrentPriceAttribute()
    {
        if ($this->is_free || $this->price <= 0) {
            return 0;
        }

        if ($this->discount_percentage > 0) {
            return $this->price * (1 - $this->discount_percentage / 100);
        }

        return $this->price;
    }

    public function getDiscountAmountAttribute()
    {
        if ($this->discount_percentage <= 0) return 0;
        return $this->price * ($this->discount_percentage / 100);
    }

    public function getFormattedDurationAttribute()
    {
        if ($this->duration_hours < 1) {
            return round($this->duration_hours * 60) . ' minute';
        }
        return $this->duration_hours . ' ore';
    }

    public function getEstimatedStudyTimeAttribute()
    {
        // Add 50% to course duration for self-study, assignments, etc.
        return $this->duration_hours * 1.5;
    }

    public function getDifficultyLevelLabelAttribute()
    {
        return match($this->difficulty_level) {
            'beginner' => 'Începător',
            'intermediate' => 'Intermediar',
            'advanced' => 'Avansat',
            'expert' => 'Expert',
            default => 'Nespecificat'
        };
    }

    public function getDifficultyColorAttribute()
    {
        return match($this->difficulty_level) {
            'beginner' => 'green',
            'intermediate' => 'blue',
            'advanced' => 'orange',
            'expert' => 'red',
            default => 'gray'
        };
    }

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'draft' => 'Ciornă',
            'review' => 'În revizuire',
            'published' => 'Publicat',
            'archived' => 'Arhivat',
            'cancelled' => 'Anulat',
            default => 'Necunoscut'
        };
    }

    // Methods
    public function isEnrollmentOpen()
    {
        return $this->status === 'published' && 
               (!$this->registration_deadline || $this->registration_deadline > now()) &&
               ($this->max_participants === null || $this->enrollments()->count() < $this->max_participants);
    }

    public function isActive()
    {
        return $this->status === 'published' &&
               (!$this->end_date || $this->end_date > now());
    }

    public function hasStarted()
    {
        return $this->start_date && $this->start_date <= now();
    }

    public function hasEnded()
    {
        return $this->end_date && $this->end_date < now();
    }

    public function canUserEnroll(User $user)
    {
        if (!$this->isEnrollmentOpen()) {
            return false;
        }

        if ($this->enrollments()->where('user_id', $user->id)->exists()) {
            return false;
        }

        if ($this->requires_approval && !$user->hasRole(['professor', 'admin'])) {
            return false;
        }

        return true;
    }

    public function enrollUser(User $user, array $data = [])
    {
        if (!$this->canUserEnroll($user)) {
            throw new \Exception('User cannot be enrolled in this course.');
        }

        return $this->enrollments()->create([
            'user_id' => $user->id,
            'enrollment_date' => now(),
            'status' => 'enrolled',
            'progress_percentage' => 0,
            ...$data
        ]);
    }

    public function getUserEnrollment(User $user)
    {
        return $this->enrollments()->where('user_id', $user->id)->first();
    }

    public function isUserEnrolled(User $user)
    {
        return $this->enrollments()->where('user_id', $user->id)->exists();
    }

    public function hasUserCompleted(User $user)
    {
        return $this->enrollments()
                   ->where('user_id', $user->id)
                   ->where('status', 'completed')
                   ->exists();
    }

    public function calculateProgress(User $user)
    {
        $enrollment = $this->getUserEnrollment($user);
        if (!$enrollment) return 0;

        $totalModules = $this->modules()->count();
        if ($totalModules === 0) return 0;

        $completedModules = $enrollment->moduleProgress()
                                     ->where('completed', true)
                                     ->count();

        return ($completedModules / $totalModules) * 100;
    }

    public function updateUserProgress(User $user)
    {
        $enrollment = $this->getUserEnrollment($user);
        if (!$enrollment) return;

        $progress = $this->calculateProgress($user);
        $enrollment->update(['progress_percentage' => $progress]);

        if ($progress >= $this->completion_rate_threshold) {
            $this->checkCourseCompletion($user);
        }
    }

    public function checkCourseCompletion(User $user)
    {
        $enrollment = $this->getUserEnrollment($user);
        if (!$enrollment || $enrollment->status === 'completed') return;

        // Check if user has passed all required tests
        $requiredTests = $this->tests()->where('is_required', true)->get();
        $passedRequiredTests = 0;

        foreach ($requiredTests as $test) {
            $bestAttempt = $test->attempts()
                              ->where('user_id', $user->id)
                              ->where('status', 'completed')
                              ->orderBy('score', 'desc')
                              ->first();

            if ($bestAttempt && $bestAttempt->score >= $test->passing_score) {
                $passedRequiredTests++;
            }
        }

        if ($passedRequiredTests === $requiredTests->count() && 
            $enrollment->progress_percentage >= $this->completion_rate_threshold) {

            $enrollment->update([
                'status' => 'completed',
                'completion_date' => now()
            ]);

            $this->generateCertificate($user);
        }
    }

    public function generateCertificate(User $user)
    {
        if ($this->certifications()->where('user_id', $user->id)->exists()) {
            return; // Certificate already exists
        }

        return $this->certifications()->create([
            'user_id' => $user->id,
            'certificate_number' => 'IZA-' . date('Y') . '-' . strtoupper(uniqid()),
            'issue_date' => now(),
            'expiry_date' => $this->certification_type === 'cme' ? now()->addMonths(24) : null,
            'cme_credits_earned' => $this->cme_credits,
            'cpe_credits_earned' => $this->cpe_credits,
            'verification_code' => strtoupper(substr(md5(uniqid()), 0, 8)),
            'status' => 'active'
        ]);
    }

    public function publish()
    {
        $this->update([
            'status' => 'published',
            'updated_at' => now()
        ]);
    }

    public function archive()
    {
        $this->update(['status' => 'archived']);
    }

    public function addToFeatured()
    {
        $this->update(['is_featured' => true]);
    }

    public function removeFromFeatured()
    {
        $this->update(['is_featured' => false]);
    }

    // Static methods
    public static function getCategories()
    {
        return [
            'cardiology' => 'Cardiologie',
            'endocrinology' => 'Endocrinologie',
            'gastroenterology' => 'Gastroenterologie',
            'neurology' => 'Neurologie',
            'psychiatry' => 'Psihiatrie',
            'surgery' => 'Chirurgie',
            'pediatrics' => 'Pediatrie',
            'geriatrics' => 'Geriatrie',
            'emergency_medicine' => 'Medicina de Urgență',
            'family_medicine' => 'Medicina de Familie',
            'internal_medicine' => 'Medicina Internă',
            'radiology' => 'Radiologie',
            'laboratory_medicine' => 'Medicina de Laborator',
            'pharmacology' => 'Farmacologie',
            'medical_ethics' => 'Etică Medicală',
            'research_methods' => 'Metode de Cercetare',
            'quality_improvement' => 'Îmbunătățirea Calității',
            'patient_safety' => 'Siguranța Pacientului'
        ];
    }

    public static function getDifficultyLevels()
    {
        return [
            'beginner' => 'Începător',
            'intermediate' => 'Intermediar',
            'advanced' => 'Avansat',
            'expert' => 'Expert'
        ];
    }

    public static function getCertificationTypes()
    {
        return [
            'completion' => 'Certificat de Participare',
            'cme' => 'Credite EMC (Educația Medicală Continuă)',
            'cpe' => 'Credite EPC (Educația Profesională Continuă)',
            'specialty' => 'Certificare de Specialitate'
        ];
    }
}
