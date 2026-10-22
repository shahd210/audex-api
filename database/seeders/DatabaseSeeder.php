<?php

namespace Database\Seeders;

use App\Enums\Department;
use App\Enums\UserRole;
use App\Models\Recommendation;
use App\Models\School;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create users
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@audex.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'department' => null,
            'is_director' => false,
        ]);

        $ceo = User::create([
            'name' => 'CEO User',
            'email' => 'ceo@audex.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Ceo,
            'department' => null,
            'is_director' => false,
        ]);

        $academicDirector = User::create([
            'name' => 'Academic Director',
            'email' => 'academic@audex.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Academic,
            'department' => 'academic',
            'is_director' => true,
        ]);

        $financeUser = User::create([
            'name' => 'Finance Manager',
            'email' => 'finance@audex.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Finance,
            'department' => 'finance',
            'is_director' => false,
        ]);

        $hrUser = User::create([
            'name' => 'HR Manager',
            'email' => 'hr@audex.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Hr,
            'department' => 'hr',
            'is_director' => false,
        ]);

        $opsUser = User::create([
            'name' => 'Operations Manager',
            'email' => 'ops@audex.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Operations,
            'department' => 'operations',
            'is_director' => false,
        ]);

        // Create school and workspace
        $school = School::create([
            'name' => 'Audex International School',
            'code' => 'AIS-001',
        ]);

        $workspace = Workspace::create([
            'school_id' => $school->id,
            'mode' => 'compass',
            'name' => 'Main Workspace 2026',
            'is_simulation' => false,
        ]);

        // Create sample recommendations
        Recommendation::create([
            'workspace_id' => $workspace->id,
            'department' => 'academic',
            'title' => 'Improve Student Attendance Tracking',
            'summary' => 'Implement digital attendance system for better tracking.',
            'details' => 'Current paper-based attendance tracking leads to data loss and delays. Recommend implementing a digital solution integrated with student information system.',
            'priority' => 'high',
            'status' => 'open',
            'source' => 'ai',
            'confidence_score' => 87.5,
            'created_by' => $admin->id,
        ]);

        Recommendation::create([
            'workspace_id' => $workspace->id,
            'department' => 'finance',
            'title' => 'Fee Collection Optimization',
            'summary' => 'Streamline fee collection process to reduce outstanding balances.',
            'details' => 'Analysis shows 23% of fees are collected late. Implementing automated reminders and online payment options could improve collection rate.',
            'priority' => 'critical',
            'status' => 'open',
            'source' => 'rule_engine',
            'confidence_score' => 95.0,
            'created_by' => $admin->id,
        ]);

        Recommendation::create([
            'workspace_id' => $workspace->id,
            'department' => 'hr',
            'title' => 'Staff Training Program Enhancement',
            'summary' => 'Develop comprehensive staff development program.',
            'details' => 'Staff satisfaction survey indicates need for better professional development opportunities. Recommend structured training calendar.',
            'priority' => 'medium',
            'status' => 'open',
            'source' => 'manual',
            'created_by' => $ceo->id,
        ]);
    }
}
