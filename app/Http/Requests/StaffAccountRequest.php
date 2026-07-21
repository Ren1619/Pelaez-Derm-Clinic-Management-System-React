<?php

namespace App\Http\Requests;

use App\Models\AccountRole;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rules\Unique;

abstract class StaffAccountRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    protected function staffRules(Unique $staffEmailRule, bool $isUpdate): array
    {
        return [
            'branch_ID' => [
                Rule::requiredIf(fn (): bool => $this->selectedRoleName() !== 'super_admin'),
                'nullable',
                'integer',
                'exists:branches,branch_ID',
            ],
            'role_ID' => ['required', 'integer', 'exists:account_roles,role_ID'],
            'first_name' => ['required', 'string', 'max:255', "regex:/^[\\pL\\s'-]+$/u"],
            'middle_name' => ['nullable', 'string', 'max:255', "regex:/^[\\pL\\s'-]+$/u"],
            'last_name' => ['required', 'string', 'max:255', "regex:/^[\\pL\\s'-]+$/u"],
            'contact_number' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                $staffEmailRule,
                Rule::unique('users', 'email'),
                Rule::unique((new Patient)->getTable(), 'email'),
            ],
            'password' => $isUpdate
                ? ['nullable', 'string', Password::min(8)->letters()->mixedCase()->numbers()->symbols(), 'confirmed']
                : ['prohibited'],
            'password_confirmation' => $isUpdate ? ['nullable', 'string'] : ['prohibited'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'branch_ID.required' => 'A branch is required unless the selected role is Super Admin.',
            'first_name.regex' => 'The first name may only contain letters, spaces, apostrophes, and hyphens.',
            'middle_name.regex' => 'The middle name may only contain letters, spaces, apostrophes, and hyphens.',
            'last_name.regex' => 'The last name may only contain letters, spaces, apostrophes, and hyphens.',
            'contact_number.regex' => 'The contact number must start with 09 and contain exactly 11 digits.',
            'email.unique' => 'The email address is already used by another account.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'branch_ID' => $this->input('branch_ID') ?: null,
            'first_name' => Str::of($this->input('first_name', ''))->squish()->toString(),
            'middle_name' => Str::of($this->input('middle_name', ''))->squish()->toString() ?: null,
            'last_name' => Str::of($this->input('last_name', ''))->squish()->toString(),
            'contact_number' => Str::of($this->input('contact_number', ''))->trim()->toString(),
            'email' => Str::of($this->input('email', ''))->trim()->lower()->toString(),
        ]);
    }

    private function selectedRoleName(): ?string
    {
        return AccountRole::query()
            ->whereKey($this->integer('role_ID'))
            ->value('role_name');
    }
}
