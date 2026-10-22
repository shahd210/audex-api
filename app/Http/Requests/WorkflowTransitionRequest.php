<?php

namespace App\Http\Requests;

use App\Enums\WorkflowStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class WorkflowTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy checked in controller
    }

    public function rules(): array
    {
        return [
            'to' => ['required', new Enum(WorkflowStatus::class)],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
