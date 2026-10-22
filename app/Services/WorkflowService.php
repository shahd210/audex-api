<?php

namespace App\Services;

use App\Enums\RecommendationStatus;
use App\Enums\WorkflowStatus;
use App\Models\Recommendation;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStatusHistory;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowService
{
    public function __construct(private readonly AuditService $audit) {}

    public function create(array $data, User $user): Workflow
    {
        return DB::transaction(function () use ($data, $user) {
            if (!empty($data['recommendation_id'])) {
                $rec = Recommendation::findOrFail($data['recommendation_id']);
                $this->validateRecommendation($rec, $data['workspace_id'] ?? null, $user);
            }

            $workflow = Workflow::create(array_merge($data, [
                'created_by' => $user->id,
                'owner_id' => $data['owner_id'] ?? $user->id,
                'status' => WorkflowStatus::Draft->value,
            ]));

            if (!empty($data['recommendation_id'])) {
                $rec->update(['status' => RecommendationStatus::Linked]);
            }

            WorkflowStatusHistory::create([
                'workflow_id' => $workflow->id,
                'from_status' => null,
                'to_status' => WorkflowStatus::Draft->value,
                'changed_by' => $user->id,
                'reason' => 'Workflow created',
            ]);

            $this->audit->logCreated($workflow);

            return $workflow->load(['workspace', 'recommendation', 'owner', 'creator', 'tasks']);
        });
    }

    private function validateRecommendation(Recommendation $rec, ?int $workspaceId, User $user): void
    {
        if ($rec->status !== RecommendationStatus::Open) {
            throw ValidationException::withMessages([
                'recommendation_id' => 'Recommendation is not in open status.',
            ]);
        }

        if ($rec->isExpired()) {
            throw ValidationException::withMessages([
                'recommendation_id' => 'Recommendation has expired.',
            ]);
        }

        if ($workspaceId && $rec->workspace_id !== $workspaceId) {
            throw ValidationException::withMessages([
                'recommendation_id' => 'Recommendation does not belong to this workspace.',
            ]);
        }

        if (!$user->canAccessDepartment($rec->department->value)) {
            throw ValidationException::withMessages([
                'recommendation_id' => 'You do not have access to this recommendation\'s department.',
            ]);
        }

        if ($rec->hasActiveWorkflow()) {
            throw ValidationException::withMessages([
                'recommendation_id' => 'Recommendation already has an active workflow.',
            ]);
        }
    }

    public function transition(Workflow $workflow, WorkflowStatus $toStatus, User $user, ?string $reason): Workflow
    {
        return DB::transaction(function () use ($workflow, $toStatus, $user, $reason) {
            $this->validateTransition($workflow, $toStatus, $user, $reason);

            $oldStatus = $workflow->status->value;

            $updateData = ['status' => $toStatus->value];

            if (in_array($toStatus, [WorkflowStatus::Approved, WorkflowStatus::Rejected, WorkflowStatus::EvidenceRequested])) {
                $updateData['approved_by'] = $user->id;
                $updateData['approved_at'] = now();
                $updateData['decision_reason'] = $reason;
            }

            if ($toStatus === WorkflowStatus::Cancelled || $toStatus === WorkflowStatus::Rejected) {
                // If cancelling/rejecting, reopen recommendation if linked
                if ($workflow->recommendation_id) {
                    $workflow->recommendation()->update(['status' => RecommendationStatus::Open]);
                }
            }

            $workflow->update($updateData);

            WorkflowStatusHistory::create([
                'workflow_id' => $workflow->id,
                'from_status' => $oldStatus,
                'to_status' => $toStatus->value,
                'changed_by' => $user->id,
                'reason' => $reason,
            ]);

            $this->audit->logStatusChange($workflow, $oldStatus, $toStatus->value, $reason);

            return $workflow->fresh(['tasks', 'recommendation', 'statusHistories', 'owner']);
        });
    }

    private function validateTransition(Workflow $workflow, WorkflowStatus $toStatus, User $user, ?string $reason): void
    {
        if (!$workflow->status->canTransitionTo($toStatus)) {
            $allowed = array_map(fn($s) => $s->value, $workflow->status->allowedTransitions());
            throw ValidationException::withMessages([
                'to' => 'Invalid transition from ' . $workflow->status->value . ' to ' . $toStatus->value . '. Allowed: ' . implode(', ', $allowed),
            ]);
        }

        // submitted needs >= 1 task
        if ($toStatus === WorkflowStatus::Submitted) {
            if ($workflow->tasks()->count() === 0) {
                throw ValidationException::withMessages([
                    'to' => 'Workflow must have at least one task before submitting.',
                ]);
            }
        }

        // approved/rejected/evidence_requested require reason and approver
        if (in_array($toStatus, [WorkflowStatus::Approved, WorkflowStatus::Rejected, WorkflowStatus::EvidenceRequested])) {
            if (empty($reason)) {
                throw ValidationException::withMessages([
                    'reason' => 'A reason is required for this transition.',
                ]);
            }

            if (!$user->canApprove($workflow)) {
                throw ValidationException::withMessages([
                    'to' => 'You do not have permission to approve/reject this workflow.',
                ]);
            }

            if ($user->id === $workflow->created_by) {
                throw ValidationException::withMessages([
                    'to' => 'The workflow creator cannot approve or reject their own workflow.',
                ]);
            }
        }

        // in_progress requires every task to have assignee, due_date, KPI
        if ($toStatus === WorkflowStatus::InProgress) {
            if (!$workflow->allTasksHaveAssigneeAndDueDate()) {
                throw ValidationException::withMessages([
                    'to' => 'All tasks must have an assignee and due date before moving to in_progress.',
                ]);
            }
            if (!$workflow->allTasksHaveKpi()) {
                throw ValidationException::withMessages([
                    'to' => 'All tasks must have KPI defined before moving to in_progress.',
                ]);
            }
        }

        // completed requires every task done or cancelled
        if ($toStatus === WorkflowStatus::Completed) {
            if (!$workflow->allTasksDoneOrCancelled()) {
                throw ValidationException::withMessages([
                    'to' => 'All tasks must be done or cancelled before completing the workflow.',
                ]);
            }
        }

        // evidence required for approval check
        if ($toStatus === WorkflowStatus::Approved && Config::get('audex.evidence_required_for_approval', false)) {
            $tasksWithoutEvidence = $workflow->tasks()
                ->whereNotIn('status', ['cancelled'])
                ->whereDoesntHave('evidences')
                ->pluck('title', 'id');

            if ($tasksWithoutEvidence->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'to' => 'All tasks must have evidence linked. Tasks missing evidence: ' . $tasksWithoutEvidence->implode(', '),
                ]);
            }
        }
    }
}
