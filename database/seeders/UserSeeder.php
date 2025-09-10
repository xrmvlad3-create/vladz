<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@izamanagement.ro'],
            [
                'name' => 'Iza Admin',
                'password' => Hash::make('Admin!234'),
                'specialization' => 'Administrator',
                'institution' => 'IzaManagement',
                'license_number' => 'ADM-0001',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('super_admin');

        // Professor
        $prof = User::firstOrCreate(
            ['email' => 'profesor@izamanagement.ro'],
            [
                'name' => 'Dr. Prof. Andrei Popescu',
                'password' => Hash::make('Profesor!234'),
                'specialization' => 'Cardiologie',
                'institution' => 'UMF Carol Davila',
                'license_number' => 'CD-123456',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $prof->assignRole('professor');

        // Doctor
        $doc = User::firstOrCreate(
            ['email' => 'doctor@izamanagement.ro'],
            [
                'name' => 'Dr. Ioana Ionescu',
                'password' => Hash::make('Doctor!234'),
                'specialization' => 'Medicină de Urgență',
                'institution' => 'SMURD',
                'license_number' => 'MU-654321',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $doc->assignRole('doctor');

        // Student
        $student = User::firstOrCreate(
            ['email' => 'student@izamanagement.ro'],
            [
                'name' => 'Student Mihai',
                'password' => Hash::make('Student!234'),
                'specialization' => 'Student',
                'institution' => 'UMF Iași',
                'license_number' => null,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $student->assignRole('student');
    }
}