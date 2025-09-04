<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TreatmentProtocol extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'medical_condition_id', 'name', 'description', 'protocol_type', 
        'treatment_steps', 'medications', 'dosage_instructions', 'duration',
        'monitoring_parameters', 'contraindications', 'side_effects',
        'drug_interactions', 'special_considerations', 'success_criteria',
        'failure_criteria', 'alternative_treatments', 'emergency_protocols',
        'patient_instructions', 'follow_up_schedule', 'cost_considerations',
        'evidence_level', 'guidelines_source', 'last_updated', 'created_by',
        'approved_by', 'status', 'version', 'language', 'tags'
    ];

    protected $casts = [
        'treatment_steps' => 'array',
        'medications' => 'array',
        'dosage_instructions' => 'array',
        'monitoring_parameters' => 'array',
        'contraindications' => 'array',
        'side_effects' => 'array',
        'drug_interactions' => 'array',
        'special_considerations' => 'array',
        'success_criteria' => 'array',
        'failure_criteria' => 'array',
        'alternative_treatments' => 'array',
        'emergency_protocols' => 'array',
        'patient_instructions' => 'array',
        'follow_up_schedule' => 'array',
        'cost_considerations' => 'array',
        'tags' => 'array',
        'last_updated' => 'datetime',
        'version' => 'decimal:2'
    ];

    // Relationships
    public function medicalCondition()
    {
        return $this->belongsTo(MedicalCondition::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function medications()
    {
        return $this->belongsToMany(Medication::class)->withPivot(['dosage', 'frequency', 'duration', 'notes']);
    }

    public function laboratoryTests()
    {
        return $this->belongsToMany(LaboratoryTest::class)->withPivot(['frequency', 'timing', 'target_values']);
    }
}
