<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->isAdmin() || $user->isCeo()) return true;
        return $user->canAccessDepartment($task->workflow->department->value)
            || $user->id === $task->assignee_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        // Assignee can update status and progress_note only (enforced in service)
        return $user->canAccessDepartment($task->workflow->department->value)
            || $user->id === $task->assignee_id;
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $task->workflow->owner_id || $user->id === $task->workflow->created_by;
    }

    public function isOwnerOrAdmin(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $task->workflow->owner_id
            || $user->id === $task->workflow->created_by;
    }
}
