<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePatientVisitRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'branch_ID' => ['required', 'integer', Rule::exists('branches', 'branch_ID')],
            'doctor_account_ID' => ['nullable', 'integer', Rule::exists('staff_accounts', 'account_ID')],
            'visited_at' => ['required', 'date'],
            'blood_pressure' => ['nullable', 'string', 'max:20', 'regex:/^\d{2,3}\/\d{2,3}$/'],
            'weight' => ['nullable', 'numeric', 'gt:0', 'max:999.99'],
            'height' => ['nullable', 'numeric', 'gt:0', 'max:999.99'],
            'status' => ['required', Rule::in(['in_progress', 'completed', 'cancelled'])],
        ];
    }
}
