<?php

namespace App\Policies;

use App\Models\Recommendation;
use App\Models\User;

class RecommendationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Recommendation $recommendation): bool
    {
        if ($user->isAdmin() || $user->isCeo()) return true;
        return $user->canAccessDepartment($recommendation->department->value);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isCeo();
    }

    public function update(User $user, Recommendation $recommendation): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Recommendation $recommendation): bool
    {
        return $user->isAdmin();
    }
}
