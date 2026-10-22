<?php

namespace App\Models;

use App\Enums\Department;
use App\Enums\EvidenceState;
use App\Enums\EvidenceType;
use App\Enums\ExtractionStatus;
use App\Enums\IndexStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Evidence extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'uploaded_by',
        'department',
        'type',
        'title',
        'note',
        'file_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'extraction_status',
        'index_status',
        'evidence_state',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'department' => Department::class,
            'type' => EvidenceType::class,
            'extraction_status' => ExtractionStatus::class,
            'index_status' => IndexStatus::class,
            'evidence_state' => EvidenceState::class,
            'expires_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'evidence_task')
            ->withPivot('linked_by')
            ->withTimestamps();
    }
}
