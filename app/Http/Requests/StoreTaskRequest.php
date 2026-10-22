<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy checked in controller
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['required', 'integer', 'exists:users,id'],
            'due_date' => ['required', 'date', 'after_or_equal:today'],
            'kpi_name' => ['nullable', 'string', 'max:255'],
            'kpi_target' => ['nullable', 'numeric', 'min:0'],
            'kpi_unit' => ['nullable', 'string', 'max:100'],
        ];
    }
}
