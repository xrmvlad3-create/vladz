<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray($request): array
    {
        /** @var \App\Models\Course $course */
        $course = $this->resource;

        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'category' => $course->category,
            'difficulty_level' => $course->difficulty_level,
            'difficulty_label' => $course->difficulty_level_label,
            'duration_hours' => (float) $course->duration_hours,
            'formatted_duration' => $course->formatted_duration,
            'price' => (float) $course->price,
            'current_price' => (float) $course->current_price,
            'discount_percentage' => (float) ($course->discount_percentage ?? 0),
            'is_free' => (bool) $course->is_free,
            'is_featured' => (bool) $course->is_featured,
            'requires_approval' => (bool) $course->requires_approval,
            'cme_credits' => (float) ($course->cme_credits ?? 0),
            'cpe_credits' => (float) ($course->cpe_credits ?? 0),
            'certification_type' => $course->certification_type,
            'status' => $course->status,
            'status_label' => $course->status_label,
            'start_date' => optional($course->start_date)?->toISOString(),
            'end_date' => optional($course->end_date)?->toISOString(),
            'registration_deadline' => optional($course->registration_deadline)?->toISOString(),
            'instructor' => $course->instructor ? [
                'id' => $course->instructor->id,
                'name' => $course->instructor->name,
                'specialization' => $course->instructor->specialization,
                'institution' => $course->instructor->institution,
                'avatar' => $course->instructor->avatar,
            ] : null,
            'learning_objectives' => $course->learning_objectives,
            'prerequisites' => $course->prerequisites,
            'assessment_criteria' => $course->assessment_criteria,
            'tags' => $course->tags,
            'target_audience' => $course->target_audience,
            'modules' => $course->relationLoaded('modules') ? $course->modules->map(function ($m) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'description' => $m->description,
                    'duration_minutes' => (int) $m->duration_minutes,
                    'order_index' => (int) $m->order_index,
                    'is_mandatory' => (bool) $m->is_mandatory,
                ];
            }) : [],
            'tests' => $course->relationLoaded('tests') ? $course->tests->map(function ($t) {
                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'description' => $t->description,
                    'passing_score' => (float) $t->passing_score,
                    'time_limit_minutes' => $t->time_limit_minutes,
                    'max_attempts' => $t->max_attempts,
                    'is_required' => (bool) $t->is_required,
                ];
            }) : [],
            'announcements' => $course->relationLoaded('announcements') ? $course->announcements->map(function ($a) {
                return [
                    'id' => $a->id,
                    'title' => $a->title,
                    'content' => $a->content,
                    'published_at' => optional($a->published_at)?->toISOString(),
                ];
            }) : [],
            'stats' => $course->stats ?? null,
            'enrollment' => $course->enrollment ?? null,
            'can_enroll' => $course->can_enroll ?? null,
            'progress_percentage' => $course->progress_percentage ?? 0,
            'module_progress' => $course->module_progress ?? [],
            'created_at' => $course->created_at?->toISOString(),
            'updated_at' => $course->updated_at?->toISOString(),
        ];
    }
}