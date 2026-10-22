<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'recommendation_id' => $this->recommendation_id,
            'title' => $this->title,
            'description' => $this->description,
            'department' => $this->department->value,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'owner_id' => $this->owner_id,
            'owner' => $this->whenLoaded('owner', fn() => new UserResource($this->owner)),
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', fn() => new UserResource($this->creator)),
            'approved_by' => $this->approved_by,
            'approver' => $this->whenLoaded('approver', fn() => new UserResource($this->approver)),
            'approved_at' => $this->approved_at,
            'decision_reason' => $this->decision_reason,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'recommendation' => $this->whenLoaded('recommendation', fn() => new RecommendationResource($this->recommendation)),
            'tasks' => $this->whenLoaded('tasks', fn() => TaskResource::collection($this->tasks)),
            'status_histories' => $this->whenLoaded('statusHistories', fn() =>
                $this->statusHistories->map(fn($h) => [
                    'id' => $h->id,
                    'from_status' => $h->from_status,
                    'to_status' => $h->to_status,
                    'changed_by' => $h->changed_by,
                    'reason' => $h->reason,
                    'created_at' => $h->created_at,
                ])
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
