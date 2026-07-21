<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

abstract class PatientRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    protected function patientRules(Unique $patientEmailRule): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255', "regex:/^[\\pL\\s'.-]+$/u"],
            'middle_name' => ['nullable', 'string', 'max:255', "regex:/^[\\pL\\s'.-]+$/u"],
            'last_name' => ['required', 'string', 'max:255', "regex:/^[\\pL\\s'.-]+$/u"],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                $patientEmailRule,
                Rule::unique('staff_accounts', 'email'),
                Rule::unique('users', 'email'),
            ],
            'contact_number' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'address' => ['required', 'string', 'max:500'],
            'sex' => ['required', Rule::in(['Male', 'Female'])],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'civil_status' => ['required', Rule::in(['Single', 'Married', 'Divorced', 'Widowed'])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'first_name.regex' => 'The first name may only contain letters, spaces, periods, apostrophes, and hyphens.',
            'middle_name.regex' => 'The middle name may only contain letters, spaces, periods, apostrophes, and hyphens.',
            'last_name.regex' => 'The last name may only contain letters, spaces, periods, apostrophes, and hyphens.',
            'contact_number.regex' => 'The contact number must start with 09 and contain exactly 11 digits.',
            'email.unique' => 'The email address is already used by another account.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => Str::of($this->input('first_name', ''))->squish()->toString(),
            'middle_name' => Str::of($this->input('middle_name', ''))->squish()->toString() ?: null,
            'last_name' => Str::of($this->input('last_name', ''))->squish()->toString(),
            'email' => Str::of($this->input('email', ''))->trim()->lower()->toString(),
            'contact_number' => Str::of($this->input('contact_number', ''))->trim()->toString(),
            'address' => Str::of($this->input('address', ''))->squish()->toString(),
        ]);
    }
}
