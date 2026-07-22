<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePatientMedicationRequest extends FormRequest
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
            'medication' => [
                'required',
                'string',
                'max:255',
                Rule::unique('patient_medications', 'medication')
                    ->where('PID', $this->patient()->PID)
                    ->ignore($this->route('medication')),
            ],
            'dosage' => ['nullable', 'string', 'max:255'],
            'frequency' => ['nullable', 'string', 'max:255'],
            'duration' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function patient(): Patient
    {
        $patient = $this->route('patient') ?? $this->user('patient');

        if (! $patient instanceof Patient) {
            throw new \LogicException('An authenticated or route-bound patient is required.');
        }

        return $patient;
    }
}
