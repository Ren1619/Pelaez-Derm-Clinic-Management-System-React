<?php

namespace App\Http\Requests;

use App\Models\PatientVisit;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePatientVisitProductRequest extends FormRequest
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
            'product_ID' => [
                'required',
                'integer',
                Rule::exists('products', 'product_ID'),
                Rule::unique('patient_visit_products', 'product_ID')
                    ->where('visit_ID', $this->visit()->visit_ID)
                    ->ignore($this->route('product')),
            ],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
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
