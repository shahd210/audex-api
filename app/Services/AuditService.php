<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public function log(
        string $action,
        string $auditableType,
        int $auditableId,
        array $oldValues = null,
        array $newValues = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'created_at' => now(),
        ]);
    }

    public function logCreated(object $model): AuditLog
    {
        return $this->log(
            'created',
            get_class($model),
            $model->id,
            null,
            $model->toArray()
        );
    }

    public function logUpdated(object $model, array $oldValues): AuditLog
    {
        return $this->log(
            'updated',
            get_class($model),
            $model->id,
            $oldValues,
            $model->getChanges()
        );
    }

    public function logStatusChange(
        object $model,
        string $fromStatus,
        string $toStatus,
        string $reason = null
    ): AuditLog {
        return $this->log(
            'status_changed',
            get_class($model),
            $model->id,
            ['status' => $fromStatus],
            ['status' => $toStatus, 'reason' => $reason]
        );
    }

    public function logEvidenceLinked(int $evidenceId, int $taskId): AuditLog
    {
        return $this->log(
            'evidence_linked',
            'App\\Models\\Evidence',
            $evidenceId,
            null,
            ['task_id' => $taskId]
        );
    }
}
