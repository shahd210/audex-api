<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy + service checks in controller
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['sometimes', 'integer', 'exists:users,id'],
            'due_date' => ['sometimes', 'date'],
            'kpi_name' => ['nullable', 'string', 'max:255'],
            'kpi_target' => ['nullable', 'numeric', 'min:0'],
            'kpi_unit' => ['nullable', 'string', 'max:100'],
            'kpi_actual' => ['nullable', 'numeric', 'min:0'],
            'progress_note' => ['nullable', 'string'],
        ];
    }
}
