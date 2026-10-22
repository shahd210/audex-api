<?php

namespace App\Http\Requests;

use App\Enums\Department;
use App\Enums\EvidenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'workspace_id' => ['required', 'integer', 'exists:workspaces,id'],
            'department' => ['required', new Enum(Department::class)],
            'type' => ['required', new Enum(EvidenceType::class)],
            'title' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'file' => ['required_if:type,file', 'nullable', 'file', 'max:51200'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
