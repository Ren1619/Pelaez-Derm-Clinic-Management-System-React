<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StorePatientRegistrationRequest extends PatientRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            ...$this->patientRules(
                Rule::unique((new Patient)->getTable(), 'email'),
            ),
            'password' => ['required', 'confirmed', Password::defaults()],
            'privacy_accepted' => ['required', 'accepted'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            ...parent::messages(),
            'privacy_accepted.accepted' => 'You must read and accept the privacy notice before creating an account.',
        ];
    }
}
