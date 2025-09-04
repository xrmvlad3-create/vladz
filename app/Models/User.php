<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'specialization', 'license_number',
        'institution', 'department', 'phone', 'country', 'city', 
        'bio', 'avatar', 'is_active', 'last_login_at', 'email_verified_at',
        'two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at'
    ];

    protected $hidden = [
        'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
        'two_factor_recovery_codes' => 'encrypted:array',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function medicalConditions()
    {
        return $this->hasMany(MedicalCondition::class, 'created_by');
    }

    public function treatmentProtocols()
    {
        return $this->hasMany(TreatmentProtocol::class, 'created_by');
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function courseEnrollments()
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function aiInteractions()
    {
        return $this->hasMany(AiInteraction::class);
    }

    public function certifications()
    {
        return $this->hasMany(Certification::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function medicalImages()
    {
        return $this->hasMany(MedicalImage::class, 'uploaded_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    public function scopeWithRole($query, $role)
    {
        return $query->whereHas('roles', function ($q) use ($role) {
            $q->where('name', $role);
        });
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return trim($this->name);
    }

    public function getInitialsAttribute()
    {
        $names = explode(' ', $this->name);
        $initials = '';
        foreach ($names as $name) {
            $initials .= strtoupper(substr($name, 0, 1));
        }
        return $initials;
    }

    public function getIsProfessorAttribute()
    {
        return $this->hasRole(['professor', 'admin', 'super_admin']);
    }

    public function getIsDoctorAttribute()
    {
        return $this->hasRole(['doctor', 'professor', 'admin', 'super_admin']);
    }

    // Methods
    public function hasCompletedProfile()
    {
        return !empty($this->specialization) && 
               !empty($this->institution) && 
               !empty($this->license_number);
    }

    public function getCompletedCoursesCount()
    {
        return $this->courseEnrollments()
                   ->where('status', 'completed')
                   ->count();
    }

    public function getTotalCmeCredits()
    {
        return $this->certifications()
                   ->where('status', 'active')
                   ->sum('cme_credits_earned');
    }

    public function updateLastLogin()
    {
        $this->update(['last_login_at' => now()]);
    }

    public function canAccessAi()
    {
        return $this->hasPermissionTo('use ai assistant') && $this->is_active;
    }

    public function getMonthlyAiUsage()
    {
        return $this->aiInteractions()
                   ->where('created_at', '>=', now()->startOfMonth())
                   ->count();
    }

    public function hasExceededAiLimits()
    {
        $monthlyLimit = 1000; // Base limit

        if ($this->hasRole('enterprise')) {
            $monthlyLimit = 10000;
        } elseif ($this->hasRole('professional')) {
            $monthlyLimit = 5000;
        }

        return $this->getMonthlyAiUsage() >= $monthlyLimit;
    }
}
