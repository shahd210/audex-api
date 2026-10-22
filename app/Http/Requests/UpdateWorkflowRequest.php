<?php

namespace App\Http\Requests;

use App\Enums\Department;
use App\Enums\RecommendationPriority;
use App\Enums\WorkflowType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy checked in controller
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', new Enum(WorkflowType::class)],
            'priority' => ['sometimes', new Enum(RecommendationPriority::class)],
            'owner_id' => ['sometimes', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
