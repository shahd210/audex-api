<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecommendationRequest;
use App\Http\Resources\RecommendationResource;
use App\Http\Resources\WorkflowResource;
use App\Models\Recommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecommendationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Recommendation::class);

        $user = $request->user();
        $query = Recommendation::with(['workspace', 'creator', 'workflows']);

        // Department filtering for non-admin/ceo
        if ($user->isDepartmentRole()) {
            $query->where('department', $user->department);
        }

        if ($workspaceId = $request->query('workspace_id')) {
            $query->where('workspace_id', $workspaceId);
        }

        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        $sort = $request->query('sort', 'created_at');
        $direction = $request->query('direction', 'desc');
        $query->orderBy($sort, $direction);

        return RecommendationResource::collection($query->paginate($request->query('per_page', 15)));
    }

    public function store(StoreRecommendationRequest $request): JsonResponse
    {
        $recommendation = Recommendation::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json(['recommendation' => new RecommendationResource($recommendation)], 201);
    }

    public function show(Recommendation $recommendation): JsonResponse
    {
        $this->authorize('view', $recommendation);

        $recommendation->load(['workspace', 'creator', 'workflows']);

        return response()->json(['recommendation' => new RecommendationResource($recommendation)]);
    }

    public function workflows(Recommendation $recommendation): AnonymousResourceCollection
    {
        $this->authorize('view', $recommendation);

        $workflows = $recommendation->workflows()->with(['owner', 'creator', 'tasks'])->paginate(15);

        return WorkflowResource::collection($workflows);
    }
}
