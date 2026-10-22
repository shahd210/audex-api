<?php

namespace App\Models;

use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'workflow_id',
        'title',
        'description',
        'assignee_id',
        'due_date',
        'kpi_name',
        'kpi_target',
        'kpi_unit',
        'kpi_actual',
        'status',
        'progress_note',
        'completed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'kpi_target' => 'decimal:2',
            'kpi_actual' => 'decimal:2',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function evidences(): BelongsToMany
    {
        return $this->belongsToMany(Evidence::class, 'evidence_task')
            ->withPivot('linked_by')
            ->withTimestamps();
    }

    public function hasEvidence(): bool
    {
        return $this->evidences()->exists();
    }
}
