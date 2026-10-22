<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_id' => $this->workflow_id,
            'title' => $this->title,
            'description' => $this->description,
            'assignee_id' => $this->assignee_id,
            'assignee' => $this->whenLoaded('assignee', fn() => new UserResource($this->assignee)),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'kpi_name' => $this->kpi_name,
            'kpi_target' => $this->kpi_target,
            'kpi_unit' => $this->kpi_unit,
            'kpi_actual' => $this->kpi_actual,
            'status' => $this->status->value,
            'progress_note' => $this->progress_note,
            'completed_at' => $this->completed_at,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', fn() => new UserResource($this->creator)),
            'evidences' => $this->whenLoaded('evidences', fn() => EvidenceResource::collection($this->evidences)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
