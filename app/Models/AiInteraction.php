<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiInteraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'session_id', 'interaction_type', 'user_input', 'ai_response',
        'context_data', 'confidence_score', 'processing_time', 'model_used',
        'tokens_used', 'cost', 'feedback_rating', 'feedback_comment',
        'flagged_content', 'safety_warnings', 'medical_condition_id',
        'image_paths', 'rationale_explanation', 'differential_diagnoses',
        'recommended_actions', 'follow_up_suggestions', 'severity_assessment',
        'urgency_level', 'provider_service', 'error_message', 'ip_address'
    ];

    protected $casts = [
        'context_data' => 'array',
        'image_paths' => 'array',
        'safety_warnings' => 'array',
        'differential_diagnoses' => 'array',
        'recommended_actions' => 'array',
        'follow_up_suggestions' => 'array',
        'confidence_score' => 'decimal:2',
        'processing_time' => 'decimal:3',
        'cost' => 'decimal:4',
        'tokens_used' => 'integer',
        'feedback_rating' => 'integer',
        'flagged_content' => 'boolean'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function medicalCondition()
    {
        return $this->belongsTo(MedicalCondition::class);
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('interaction_type', $type);
    }

    public function scopeBySession($query, $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public function scopeWithFeedback($query)
    {
        return $query->whereNotNull('feedback_rating');
    }

    public function scopeFlagged($query)
    {
        return $query->where('flagged_content', true);
    }

    public function scopeHighConfidence($query, $threshold = 0.8)
    {
        return $query->where('confidence_score', '>=', $threshold);
    }
}
