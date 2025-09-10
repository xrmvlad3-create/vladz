<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Define permissions
        $permissions = [
            'view medical conditions',
            'create medical conditions',
            'edit medical conditions',
            'delete medical conditions',
            'view courses',
            'create courses',
            'edit courses',
            'delete courses',
            'view unpublished courses',
            'use ai assistant',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Define roles and assign permissions
        $roles = [
            'super_admin' => Permission::all()->pluck('name')->toArray(),
            'admin' => [
                'view medical conditions', 'create medical conditions', 'edit medical conditions', 'delete medical conditions',
                'view courses', 'create courses', 'edit courses', 'delete courses', 'view unpublished courses', 'use ai assistant'
            ],
            'professor' => [
                'view medical conditions', 'create medical conditions', 'edit medical conditions',
                'view courses', 'create courses', 'edit courses', 'view unpublished courses', 'use ai assistant'
            ],
            'doctor' => [
                'view medical conditions', 'create medical conditions', 'edit medical conditions',
                'view courses', 'use ai assistant'
            ],
            'student' => [
                'view medical conditions', 'view courses'
            ],
            'professional' => [
                'view medical conditions', 'view courses', 'use ai assistant'
            ],
            'enterprise' => [
                'view medical conditions', 'view courses', 'use ai assistant'
            ],
        ];

        foreach ($roles as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }
    }
}