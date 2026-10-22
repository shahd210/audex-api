<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'department',
        'is_director',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_director' => 'boolean',
        ];
    }

    // Relationships
    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class, 'owner_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isCeo(): bool
    {
        return $this->role === UserRole::Ceo;
    }

    public function isDepartmentRole(): bool
    {
        return $this->role->isDepartmentRole();
    }

    public function canApprove(Workflow $workflow): bool
    {
        if ($this->isAdmin() || $this->isCeo()) {
            return true;
        }
        return $this->is_director && $this->department === $workflow->department->value;
    }

    public function canAccessDepartment(string $department): bool
    {
        if ($this->isAdmin() || $this->isCeo()) {
            return true;
        }
        return $this->department === $department;
    }
}
