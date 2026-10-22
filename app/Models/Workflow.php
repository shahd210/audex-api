<?php

namespace App\Models;

use App\Enums\Department;
use App\Enums\RecommendationPriority;
use App\Enums\WorkflowStatus;
use App\Enums\WorkflowType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workflow extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'recommendation_id',
        'title',
        'description',
        'department',
        'type',
        'status',
        'priority',
        'owner_id',
        'created_by',
        'approved_by',
        'approved_at',
        'decision_reason',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'department' => Department::class,
            'type' => WorkflowType::class,
            'status' => WorkflowStatus::class,
            'priority' => RecommendationPriority::class,
            'approved_at' => 'datetime',
            'due_date' => 'date',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function recommendation(): BelongsTo
    {
        return $this->belongsTo(Recommendation::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(WorkflowStatusHistory::class);
    }

    public function isDraft(): bool
    {
        return $this->status === WorkflowStatus::Draft;
    }

    public function allTasksHaveKpi(): bool
    {
        return !$this->tasks()
            ->whereNull('kpi_name')
            ->whereNotIn('status', ['cancelled'])
            ->exists();
    }

    public function allTasksHaveAssigneeAndDueDate(): bool
    {
        return !$this->tasks()
            ->where(function ($q) {
                $q->whereNull('assignee_id')->orWhereNull('due_date');
            })
            ->whereNotIn('status', ['cancelled'])
            ->exists();
    }

    public function allTasksDoneOrCancelled(): bool
    {
        return !$this->tasks()
            ->whereNotIn('status', ['done', 'cancelled'])
            ->exists();
    }
}
