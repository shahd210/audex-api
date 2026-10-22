<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEvidenceRequest;
use App\Http\Resources\EvidenceResource;
use App\Models\Evidence;
use App\Models\Task;
use App\Services\EvidenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EvidenceController extends Controller
{
    public function __construct(private readonly EvidenceService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Evidence::class);

        $user = $request->user();
        $query = Evidence::with(['uploader', 'workspace']);

        if ($user->isDepartmentRole()) {
            $query->where('department', $user->department);
        }

        if ($workspaceId = $request->query('workspace_id')) {
            $query->where('workspace_id', $workspaceId);
        }

        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $sort = $request->query('sort', 'created_at');
        $direction = $request->query('direction', 'desc');
        $query->orderBy($sort, $direction);

        return EvidenceResource::collection($query->paginate($request->query('per_page', 15)));
    }

    public function store(StoreEvidenceRequest $request): JsonResponse
    {
        $this->authorize('create', Evidence::class);

        $evidence = $this->service->create($request->validated(), $request->user());

        return response()->json(['evidence' => new EvidenceResource($evidence)], 201);
    }

    public function show(Evidence $evidence): JsonResponse
    {
        $this->authorize('view', $evidence);

        $evidence->load(['uploader', 'workspace', 'tasks']);

        return response()->json(['evidence' => new EvidenceResource($evidence)]);
    }

    public function destroy(Evidence $evidence): JsonResponse
    {
        $this->authorize('delete', $evidence);
        $evidence->delete();

        return response()->json(['message' => 'Evidence deleted.']);
    }

    public function linkToTask(Request $request, Evidence $evidence, Task $task): JsonResponse
    {
        $this->authorize('update', $evidence);

        $this->service->linkToTask($evidence, $task, $request->user());

        return response()->json(['message' => 'Evidence linked to task successfully.']);
    }

    public function unlinkFromTask(Evidence $evidence, Task $task): JsonResponse
    {
        $this->authorize('update', $evidence);

        $this->service->unlinkFromTask($evidence, $task);

        return response()->json(['message' => 'Evidence unlinked from task.']);
    }
}
