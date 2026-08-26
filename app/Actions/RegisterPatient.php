<?php

namespace App\Actions;

use App\Models\Patient;
use Illuminate\Support\Arr;

class RegisterPatient
{
    /** @param array<string, mixed> $attributes */
    public function execute(array $attributes): Patient
    {
        $patient = Patient::create(Arr::only($attributes, [
            'first_name',
            'middle_name',
            'last_name',
            'name_extension',
            'email',
            'contact_number',
            'address',
            'sex',
            'date_of_birth',
            'civil_status',
            'password',
        ]));

        $patient->sendEmailVerificationNotification();

        return $patient;
    }
}
