<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MedicalConditionResource extends JsonResource
{
    public function toArray($request): array
    {
        /** @var \App\Models\MedicalCondition $condition */
        $condition = $this->resource;

        return [
            'id' => $condition->id,
            'name' => $condition->name,
            'description' => $condition->description,
            'category' => $condition->category,
            'severity' => $condition->severity,
            'prevalence' => $condition->prevalence ? (float) $condition->prevalence : null,
            'icd_10_code' => $condition->icd_10_code,
            'icd_11_code' => $condition->icd_11_code,
            'snomed_ct_code' => $condition->snomed_ct_code,
            'symptoms' => $condition->symptoms,
            'risk_factors' => $condition->risk_factors,
            'complications' => $condition->complications,
            'differential_diagnosis' => $condition->differential_diagnosis,
            'red_flags' => $condition->red_flags,
            'treatment_approach' => $condition->treatment_approach,
            'prognosis' => $condition->prognosis,
            'epidemiology' => $condition->epidemiology,
            'pathophysiology' => $condition->pathophysiology,
            'clinical_features' => $condition->clinical_features,
            'laboratory_findings' => $condition->laboratory_findings,
            'imaging_findings' => $condition->imaging_findings,
            'treatment_protocols' => $condition->treatment_protocols,
            'prevention_strategies' => $condition->prevention_strategies,
            'patient_education' => $condition->patient_education,
            'follow_up_requirements' => $condition->follow_up_requirements,
            'contraindications' => $condition->contraindications,
            'drug_interactions' => $condition->drug_interactions,
            'special_populations' => $condition->special_populations,
            'emergency_management' => $condition->emergency_management,
            'chronic_management' => $condition->chronic_management,
            'monitoring_parameters' => $condition->monitoring_parameters,
            'evidence_level' => $condition->evidence_level,
            'language' => $condition->language,
            'status' => $condition->status,
            'version' => (float) $condition->version,
            'tags' => $condition->tags,
            'sources' => $condition->sources,
            'creator' => $condition->creator ? [
                'id' => $condition->creator->id,
                'name' => $condition->creator->name,
                'specialization' => $condition->creator->specialization
            ] : null,
            'reviews' => $condition->relationLoaded('reviews') ? $condition->reviews->map(function ($r) {
                return [
                    'id' => $r->id,
                    'user' => [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                        'specialization' => $r->user->specialization,
                    ],
                    'rating' => (int) $r->rating,
                    'comment' => $r->comment,
                    'created_at' => $r->created_at?->toISOString(),
                ];
            }) : [],
            'related_by_symptoms' => $condition->related_by_symptoms ?? [],
            'stats' => $condition->stats ?? null,
            'is_bookmarked' => $condition->is_bookmarked ?? false,
            'user_rating' => $condition->user_rating ?? null,
            'created_at' => $condition->created_at?->toISOString(),
            'updated_at' => $condition->updated_at?->toISOString(),
        ];
    }
}