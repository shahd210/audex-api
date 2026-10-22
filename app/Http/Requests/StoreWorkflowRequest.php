<?php

namespace App\Http\Requests;

use App\Enums\Department;
use App\Enums\RecommendationPriority;
use App\Enums\WorkflowType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'workspace_id' => ['required', 'integer', 'exists:workspaces,id'],
            'recommendation_id' => ['nullable', 'integer', 'exists:recommendations,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'department' => ['required', new Enum(Department::class)],
            'type' => ['required', new Enum(WorkflowType::class)],
            'priority' => ['required', new Enum(RecommendationPriority::class)],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
