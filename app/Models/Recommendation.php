<?php

namespace App\Models;

use App\Enums\Department;
use App\Enums\RecommendationPriority;
use App\Enums\RecommendationSource;
use App\Enums\RecommendationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recommendation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'department',
        'title',
        'summary',
        'details',
        'priority',
        'status',
        'source',
        'confidence_score',
        'source_reference',
        'expires_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'department' => Department::class,
            'priority' => RecommendationPriority::class,
            'status' => RecommendationStatus::class,
            'source' => RecommendationSource::class,
            'confidence_score' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function hasActiveWorkflow(): bool
    {
        return $this->workflows()
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->exists();
    }
}
