<?php

namespace App\Services;

use App\Models\CourseEnrollment;

class CourseProgressService
{
    /**
     * Return a detailed progress view for a given enrollment.
     */
    public function getDetailedProgress(CourseEnrollment $enrollment): array
    {
        $progress = $enrollment->module_progress ?? [];

        $total = is_array($progress) ? count($progress) : 0;
        $completed = 0;

        if ($total > 0) {
            foreach ($progress as $item) {
                if (!empty($item['completed'])) {
                    $completed++;
                }
            }
        }

        $percentage = $total > 0 ? round(($completed / $total) * 100, 2) : (float)$enrollment->progress_percentage;

        return [
            'course_id' => $enrollment->course_id,
            'user_id' => $enrollment->user_id,
            'completed_modules' => $completed,
            'total_modules' => $total,
            'percentage' => $percentage,
            'modules' => $progress,
            'last_accessed' => $enrollment->last_accessed,
            'status' => $enrollment->status,
        ];
    }

    /**
     * Check if the enrollment meets completion requirements.
     */
    public function checkCompletionRequirements(CourseEnrollment $enrollment): array
    {
        $course = $enrollment->course()->first();
        $threshold = $course?->completion_rate_threshold ?? 100.0;

        $detailed = $this->getDetailedProgress($enrollment);
        $percentage = $detailed['percentage'];

        $missing = [];
        if ($percentage < $threshold) {
            $missing[] = "Progresul minim necesar este {$threshold}%, progres curent {$percentage}%";
        }

        // Placeholder for required tests validation (not implemented without tests table)
        $testsComplete = true;

        return [
            'can_complete' => $percentage >= $threshold && $testsComplete,
            'missing_requirements' => $missing,
            'progress_percentage' => $percentage,
            'required_threshold' => (float) $threshold,
        ];
    }
}