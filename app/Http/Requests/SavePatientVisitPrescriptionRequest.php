<?php

namespace App\Http\Requests;

use App\Models\PatientVisit;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePatientVisitPrescriptionRequest extends FormRequest
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
            'prescription' => [
                'required',
                'string',
                'max:255',
                Rule::unique('patient_visit_prescriptions', 'prescription')
                    ->where('visit_ID', $this->visit()->visit_ID)
                    ->ignore($this->route('prescription')),
            ],
            'dosage' => ['nullable', 'string', 'max:255'],
            'frequency' => ['nullable', 'string', 'max:255'],
            'duration' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function visit(): PatientVisit
    {
        $visit = $this->route('visit');

        if (! $visit instanceof PatientVisit) {
            throw new \LogicException('A route-bound visit is required.');
        }

        return $visit;
    }
}
