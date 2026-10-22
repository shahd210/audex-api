<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecommendationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'workspace' => $this->whenLoaded('workspace', fn() => [
                'id' => $this->workspace->id,
                'name' => $this->workspace->name,
            ]),
            'department' => $this->department->value,
            'title' => $this->title,
            'summary' => $this->summary,
            'details' => $this->details,
            'priority' => $this->priority->value,
            'status' => $this->status->value,
            'source' => $this->source->value,
            'confidence_score' => $this->confidence_score,
            'source_reference' => $this->source_reference,
            'expires_at' => $this->expires_at,
            'is_expired' => $this->isExpired(),
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', fn() => new UserResource($this->creator)),
            'workflows_summary' => $this->whenLoaded('workflows', fn() =>
                $this->workflows->map(fn($w) => [
                    'id' => $w->id,
                    'title' => $w->title,
                    'status' => $w->status->value,
                ])
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
