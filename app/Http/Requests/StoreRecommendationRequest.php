<?php

namespace App\Http\Requests;

use App\Enums\Department;
use App\Enums\RecommendationPriority;
use App\Enums\RecommendationSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreRecommendationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin() || $this->user()->isCeo();
    }

    public function rules(): array
    {
        return [
            'workspace_id' => ['required', 'integer', 'exists:workspaces,id'],
            'department' => ['required', new Enum(Department::class)],
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['required', 'string', 'max:500'],
            'details' => ['required', 'string'],
            'priority' => ['required', new Enum(RecommendationPriority::class)],
            'source' => ['required', new Enum(RecommendationSource::class)],
            'confidence_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'source_reference' => ['nullable', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
