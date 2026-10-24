<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvidenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'uploaded_by' => $this->uploaded_by,
            'uploader' => $this->whenLoaded('uploader', fn() => new UserResource($this->uploader)),
            'department' => $this->department->value,
            'type' => $this->type->value,
            'title' => $this->title,
            'note' => $this->note,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'extraction_status' => $this->extraction_status->value,
            'index_status' => $this->index_status->value,
            'evidence_state' => $this->evidence_state?->value ?? 'planned',
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
