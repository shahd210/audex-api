<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Workflow;

class WorkflowPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Workflow $workflow): bool
    {
        if ($user->isAdmin() || $user->isCeo()) {
            return true;
        }
        return $user->canAccessDepartment($workflow->department->value);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Workflow $workflow): bool
    {
        if ($user->isAdmin()) return true;
        if (!$workflow->isDraft()) return false;
        return $user->id === $workflow->owner_id || $user->id === $workflow->created_by;
    }

    public function delete(User $user, Workflow $workflow): bool
    {
        return $user->isAdmin();
    }

    public function transition(User $user, Workflow $workflow): bool
    {
        if ($user->isAdmin() || $user->isCeo()) return true;
        return $user->canAccessDepartment($workflow->department->value);
    }

    public function approve(User $user, Workflow $workflow): bool
    {
        return $user->canApprove($workflow);
    }
}
