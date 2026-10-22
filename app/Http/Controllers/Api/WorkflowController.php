<?php

namespace App\Http\Controllers\Api;

use App\Enums\WorkflowStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkflowRequest;
use App\Http\Requests\UpdateWorkflowRequest;
use App\Http\Requests\WorkflowTransitionRequest;
use App\Http\Resources\WorkflowResource;
use App\Models\Workflow;
use App\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkflowController extends Controller
{
    public function __construct(private readonly WorkflowService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Workflow::class);

        $user = $request->user();
        $query = Workflow::with(['owner', 'creator', 'recommendation']);

        if ($user->isDepartmentRole()) {
            $query->where('department', $user->department);
        }

        if ($workspaceId = $request->query('workspace_id')) {
            $query->where('workspace_id', $workspaceId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        if ($search = $request->query('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->query('overdue')) {
            $query->where('due_date', '<', now())->whereNotIn('status', ['completed', 'cancelled']);
        }

        $sort = $request->query('sort', 'created_at');
        $direction = $request->query('direction', 'desc');
        $query->orderBy($sort, $direction);

        return WorkflowResource::collection($query->paginate($request->query('per_page', 15)));
    }

    public function store(StoreWorkflowRequest $request): JsonResponse
    {
        $this->authorize('create', Workflow::class);

        $workflow = $this->service->create($request->validated(), $request->user());

        return response()->json(['workflow' => new WorkflowResource($workflow)], 201);
    }

    public function show(Workflow $workflow): JsonResponse
    {
        $this->authorize('view', $workflow);

        $workflow->load(['workspace', 'recommendation', 'owner', 'creator', 'approver', 'tasks.assignee', 'tasks.evidences', 'statusHistories.changedBy']);

        return response()->json(['workflow' => new WorkflowResource($workflow)]);
    }

    public function update(UpdateWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('update', $workflow);

        if (!$workflow->isDraft()) {
            return response()->json([
                'message' => 'Only draft workflows can be edited.',
            ], 409);
        }

        $oldValues = $workflow->toArray();
        $workflow->update($request->validated());

        app(\App\Services\AuditService::class)->logUpdated($workflow, $oldValues);

        $workflow->load(['owner', 'creator', 'tasks']);

        return response()->json(['workflow' => new WorkflowResource($workflow)]);
    }

    public function destroy(Workflow $workflow): JsonResponse
    {
        $this->authorize('delete', $workflow);
        $workflow->delete();

        return response()->json(['message' => 'Workflow deleted.']);
    }

    public function transition(WorkflowTransitionRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('transition', $workflow);

        $toStatus = WorkflowStatus::from($request->validated('to'));
        $workflow = $this->service->transition($workflow, $toStatus, $request->user(), $request->validated('reason'));

        return response()->json(['workflow' => new WorkflowResource($workflow)]);
    }
}
