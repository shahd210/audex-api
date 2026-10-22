<?php

namespace App\Policies;

use App\Models\Evidence;
use App\Models\User;

class EvidencePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Evidence $evidence): bool
    {
        if ($user->isAdmin() || $user->isCeo()) return true;
        return $user->canAccessDepartment($evidence->department->value);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Evidence $evidence): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $evidence->uploaded_by;
    }

    public function delete(User $user, Evidence $evidence): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $evidence->uploaded_by;
    }
}
