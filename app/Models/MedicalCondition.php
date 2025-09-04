<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class MedicalCondition extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'name', 'description', 'icd_10_code', 'icd_11_code', 'snomed_ct_code',
        'category', 'severity', 'prevalence', 'symptoms', 'risk_factors',
        'complications', 'differential_diagnosis', 'red_flags', 'treatment_approach',
        'prognosis', 'epidemiology', 'pathophysiology', 'clinical_features',
        'laboratory_findings', 'imaging_findings', 'treatment_protocols',
        'prevention_strategies', 'patient_education', 'follow_up_requirements',
        'contraindications', 'drug_interactions', 'special_populations',
        'emergency_management', 'chronic_management', 'monitoring_parameters',
        'created_by', 'status', 'evidence_level', 'last_reviewed_at',
        'review_notes', 'version', 'tags', 'sources', 'language'
    ];

    protected $casts = [
        'symptoms' => 'array',
        'risk_factors' => 'array',
        'complications' => 'array',
        'differential_diagnosis' => 'array',
        'red_flags' => 'array',
        'treatment_protocols' => 'array',
        'prevention_strategies' => 'array',
        'monitoring_parameters' => 'array',
        'contraindications' => 'array',
        'drug_interactions' => 'array',
        'special_populations' => 'array',
        'tags' => 'array',
        'sources' => 'array',
        'prevalence' => 'decimal:2',
        'last_reviewed_at' => 'datetime',
        'version' => 'decimal:2'
    ];

    protected $attributes = [
        'status' => 'draft',
        'language' => 'ro',
        'version' => 1.0
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function treatmentProtocols()
    {
        return $this->hasMany(TreatmentProtocol::class);
    }

    public function aiInteractions()
    {
        return $this->hasMany(AiInteraction::class);
    }

    public function medicalImages()
    {
        return $this->hasMany(MedicalImage::class);
    }

    public function courseModules()
    {
        return $this->belongsToMany(CourseModule::class, 'course_module_medical_conditions');
    }

    public function relatedConditions()
    {
        return $this->belongsToMany(MedicalCondition::class, 'related_medical_conditions', 
                                    'condition_id', 'related_condition_id');
    }

    public function reviews()
    {
        return $this->hasMany(MedicalConditionReview::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(UserBookmark::class);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeByEvidenceLevel($query, $level)
    {
        return $query->where('evidence_level', $level);
    }

    public function scopeRecentlyUpdated($query, $days = 30)
    {
        return $query->where('updated_at', '>=', now()->subDays($days));
    }

    public function scopeNeedsReview($query)
    {
        return $query->where('last_reviewed_at', '<', now()->subMonths(12))
                    ->orWhereNull('last_reviewed_at');
    }

    public function scopeHighPrevalence($query, $threshold = 10)
    {
        return $query->where('prevalence', '>=', $threshold);
    }

    public function scopeWithTag($query, $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    // Search configuration
    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'severity' => $this->severity,
            'icd_10_code' => $this->icd_10_code,
            'icd_11_code' => $this->icd_11_code,
            'snomed_ct_code' => $this->snomed_ct_code,
            'symptoms' => $this->symptoms,
            'tags' => $this->tags,
            'status' => $this->status
        ];
    }

    // Accessors
    public function getFormattedPrevalenceAttribute()
    {
        return $this->prevalence ? $this->prevalence . '%' : 'N/A';
    }

    public function getSymptomsListAttribute()
    {
        return is_array($this->symptoms) ? implode(', ', $this->symptoms) : '';
    }

    public function getRedFlagsListAttribute()
    {
        return is_array($this->red_flags) ? implode(', ', $this->red_flags) : '';
    }

    public function getFormattedCategoryAttribute()
    {
        return ucfirst(str_replace('_', ' ', $this->category));
    }

    public function getSeverityColorAttribute()
    {
        return match($this->severity) {
            'mild' => 'green',
            'moderate' => 'yellow', 
            'severe' => 'orange',
            'critical' => 'red',
            default => 'gray'
        };
    }

    public function getReadingTimeAttribute()
    {
        $wordCount = str_word_count(strip_tags($this->description . ' ' . 
                                   $this->pathophysiology . ' ' . 
                                   $this->clinical_features));
        return ceil($wordCount / 200); // Average reading speed
    }

    // Methods
    public function hasValidIcdCodes()
    {
        return !empty($this->icd_10_code) || !empty($this->icd_11_code);
    }

    public function isHighRisk()
    {
        return in_array($this->severity, ['severe', 'critical']);
    }

    public function needsReview()
    {
        return !$this->last_reviewed_at || 
               $this->last_reviewed_at->lt(now()->subMonths(12));
    }

    public function updateReviewDate($notes = null)
    {
        $this->update([
            'last_reviewed_at' => now(),
            'review_notes' => $notes,
            'version' => $this->version + 0.1
        ]);
    }

    public function getRelatedBySymptoms($limit = 5)
    {
        if (empty($this->symptoms)) {
            return collect();
        }

        return static::published()
            ->where('id', '!=', $this->id)
            ->where(function ($query) {
                foreach ($this->symptoms as $symptom) {
                    $query->orWhereJsonContains('symptoms', $symptom);
                }
            })
            ->limit($limit)
            ->get();
    }

    public function getAverageRating()
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    public function getTotalBookmarks()
    {
        return $this->bookmarks()->count();
    }

    public function isBookmarkedBy(User $user)
    {
        return $this->bookmarks()->where('user_id', $user->id)->exists();
    }

    public function publish()
    {
        $this->update([
            'status' => 'published',
            'last_reviewed_at' => now()
        ]);
    }

    public function archive()
    {
        $this->update(['status' => 'archived']);
    }

    public function createVersion()
    {
        $attributes = $this->getAttributes();
        $attributes['version'] = $this->version + 1;
        $attributes['created_at'] = now();
        $attributes['updated_at'] = now();

        return static::create($attributes);
    }

    // Static methods
    public static function getCategories()
    {
        return [
            'cardiovascular' => 'Cardiovascular',
            'respiratory' => 'Respiratory', 
            'neurological' => 'Neurological',
            'endocrine' => 'Endocrine',
            'gastroenterology' => 'Gastroenterology',
            'nephrology' => 'Nephrology',
            'hematology' => 'Hematology',
            'oncology' => 'Oncology',
            'infectious_diseases' => 'Infectious Diseases',
            'immunology' => 'Immunology',
            'dermatology' => 'Dermatology',
            'psychiatry' => 'Psychiatry',
            'orthopedics' => 'Orthopedics',
            'ophthalmology' => 'Ophthalmology',
            'otorhinolaryngology' => 'Otorhinolaryngology',
            'gynecology' => 'Gynecology',
            'pediatrics' => 'Pediatrics',
            'geriatrics' => 'Geriatrics',
            'emergency_medicine' => 'Emergency Medicine',
            'anesthesiology' => 'Anesthesiology'
        ];
    }

    public static function getSeverityLevels()
    {
        return [
            'mild' => 'Mild',
            'moderate' => 'Moderate',
            'severe' => 'Severe',
            'critical' => 'Critical'
        ];
    }

    public static function getEvidenceLevels()
    {
        return [
            'A' => 'Level A - High Quality Evidence',
            'B' => 'Level B - Moderate Quality Evidence', 
            'C' => 'Level C - Low Quality Evidence',
            'D' => 'Level D - Expert Opinion'
        ];
    }
}
