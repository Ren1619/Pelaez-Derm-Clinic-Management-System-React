<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends PatientRequest
{
    public function authorize(): bool
    {
        $patient = $this->route('patient');

        return $patient instanceof Patient
            && ($this->user()?->can('update', $patient) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var Patient $patient */
        $patient = $this->route('patient');

        return $this->patientRules(
            Rule::unique((new Patient)->getTable(), 'email')->ignore($patient),
        );
    }
}
