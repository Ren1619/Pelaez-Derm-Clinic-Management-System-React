<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePatientAllergyRequest extends FormRequest
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
            'allergy' => [
                'required',
                'string',
                'max:255',
                Rule::unique('patient_allergies', 'allergy')
                    ->where('PID', $this->patient()->PID)
                    ->ignore($this->route('allergy')),
            ],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function patient(): Patient
    {
        $patient = $this->route('patient');

        if (! $patient instanceof Patient) {
            throw new \LogicException('A route-bound patient is required.');
        }

        return $patient;
    }
}
