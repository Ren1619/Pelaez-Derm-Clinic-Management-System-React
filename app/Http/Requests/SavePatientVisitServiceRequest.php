<?php

namespace App\Http\Requests;

use App\Models\PatientVisit;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePatientVisitServiceRequest extends FormRequest
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
            'service_ID' => [
                'required',
                'integer',
                Rule::exists('services', 'service_ID'),
                Rule::unique('patient_visit_services', 'service_ID')
                    ->where('visit_ID', $this->visit()->visit_ID)
                    ->ignore($this->route('service')),
            ],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
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
