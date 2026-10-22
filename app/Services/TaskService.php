<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function __construct(private readonly AuditService $audit) {}

    public function create(Workflow $workflow, array $data, User $user): Task
    {
        return DB::transaction(function () use ($workflow, $data, $user) {
            $this->validateDueDate($data['due_date'] ?? null, $workflow);

            $task = Task::create(array_merge($data, [
                'workflow_id' => $workflow->id,
                'created_by' => $user->id,
                'status' => TaskStatus::Todo->value,
            ]));

            $this->audit->logCreated($task);

            return $task->load(['assignee', 'creator', 'evidences']);
        });
    }

    public function update(Task $task, array $data, User $user, bool $isOwnerOrAdmin): Task
    {
        return DB::transaction(function () use ($task, $data, $user, $isOwnerOrAdmin) {
            $restrictedFields = ['title', 'due_date', 'kpi_name', 'kpi_target', 'kpi_unit', 'assignee_id'];
            $hasRestrictedChanges = !empty(array_intersect_key($data, array_flip($restrictedFields)));

            if ($hasRestrictedChanges && !$isOwnerOrAdmin) {
                throw ValidationException::withMessages([
                    'authorization' => 'Only the workflow owner or admin can change title, due_date, KPI, or assignee.',
                ]);
            }

            if (isset($data['due_date'])) {
                $this->validateDueDate($data['due_date'], $task->workflow);
            }

            $oldValues = $task->toArray();
            $task->update($data);
            $this->audit->logUpdated($task, $oldValues);

            return $task->fresh(['assignee', 'creator', 'evidences']);
        });
    }

    public function updateStatus(Task $task, TaskStatus $status, User $user): Task
    {
        return DB::transaction(function () use ($task, $status, $user) {
            $oldStatus = $task->status->value;

            $updateData = ['status' => $status->value];
            if ($status === TaskStatus::Done) {
                $updateData['completed_at'] = now();
            }

            $task->update($updateData);
            $this->audit->logStatusChange($task, $oldStatus, $status->value);

            return $task->fresh(['assignee', 'creator', 'evidences']);
        });
    }

    private function validateDueDate(?string $dueDate, Workflow $workflow): void
    {
        if (!$dueDate) return;

        $date = \Carbon\Carbon::parse($dueDate);

        if ($date->isPast() && !$date->isToday()) {
            throw ValidationException::withMessages([
                'due_date' => 'Due date must be today or in the future.',
            ]);
        }

        if ($workflow->due_date && $date->gt($workflow->due_date)) {
            throw ValidationException::withMessages([
                'due_date' => 'Task due date cannot be after the workflow due date (' . $workflow->due_date->format('Y-m-d') . ').',
            ]);
        }
    }
}
