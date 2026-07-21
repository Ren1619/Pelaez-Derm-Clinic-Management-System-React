<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Validation\Rule;

class StorePatientRequest extends PatientRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Patient::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return $this->patientRules(
            Rule::unique((new Patient)->getTable(), 'email'),
        );
    }
}
