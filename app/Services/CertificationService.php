<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use App\Models\Certification;

class CertificationService
{
    public function generateCertificate(Course $course, User $user): Certification
    {
        /** @var Certification|null $existing */
        $existing = $course->certifications()->where('user_id', $user->id)->first();
        if ($existing) {
            return $existing;
        }

        /** @var Certification $certificate */
        $certificate = $course->generateCertificate($user);

        return $certificate;
    }
}