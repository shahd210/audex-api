<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\Workflow;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $service) {}

    public function indexForWorkflow(Request $request, Workflow $workflow): AnonymousResourceCollection
    {
        $this->authorize('view', $workflow);

        $query = $workflow->tasks()->with(['assignee', 'creator', 'evidences']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($assigneeId = $request->query('assignee_id')) {
            $query->where('assignee_id', $assigneeId);
        }

        if ($request->query('overdue')) {
            $query->where('due_date', '<', now())->whereNotIn('status', ['done', 'cancelled']);
        }

        $sort = $request->query('sort', 'due_date');
        $direction = $request->query('direction', 'asc');
        $query->orderBy($sort, $direction);

        return TaskResource::collection($query->paginate($request->query('per_page', 15)));
    }

    public function store(StoreTaskRequest $request, Workflow $workflow): JsonResponse
    {
        $this->authorize('view', $workflow);
        $this->authorize('create', Task::class);

        $task = $this->service->create($workflow, $request->validated(), $request->user());

        return response()->json(['task' => new TaskResource($task)], 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $task->load(['assignee', 'creator', 'evidences', 'workflow']);

        return response()->json(['task' => new TaskResource($task)]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $isOwnerOrAdmin = $this->canManageTask($request->user(), $task);

        $task = $this->service->update($task, $request->validated(), $request->user(), $isOwnerOrAdmin);

        return response()->json(['task' => new TaskResource($task)]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);
        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validated();
        $status = \App\Enums\TaskStatus::from($data['status']);

        if (isset($data['progress_note'])) {
            $task->update(['progress_note' => $data['progress_note']]);
        }

        $task = $this->service->updateStatus($task, $status, $request->user());

        return response()->json(['task' => new TaskResource($task)]);
    }

    public function myTasks(Request $request): AnonymousResourceCollection
    {
        $query = Task::where('assignee_id', $request->user()->id)
            ->with(['assignee', 'creator', 'evidences', 'workflow']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->query('overdue')) {
            $query->where('due_date', '<', now())->whereNotIn('status', ['done', 'cancelled']);
        }

        $sort = $request->query('sort', 'due_date');
        $direction = $request->query('direction', 'asc');
        $query->orderBy($sort, $direction);

        return TaskResource::collection($query->paginate($request->query('per_page', 15)));
    }

    private function canManageTask(\App\Models\User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $task->workflow->owner_id || $user->id === $task->workflow->created_by;
    }
}
