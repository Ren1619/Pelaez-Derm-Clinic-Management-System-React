<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        if ($user instanceof User) {
            return $this->profileRules($user->id);
        }

        abort_unless($user instanceof StaffAccount, 403);

        return [
            'first_name' => ['required', 'string', 'max:255', "regex:/^[\pL\pM .'-]+$/u"],
            'middle_name' => ['nullable', 'string', 'max:255', "regex:/^[\pL\pM .'-]+$/u"],
            'last_name' => ['required', 'string', 'max:255', "regex:/^[\pL\pM .'-]+$/u"],
            'contact_number' => ['required', 'regex:/^09\d{9}$/'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(StaffAccount::class, 'email')->ignore($user->account_ID, 'account_ID'),
                Rule::unique(Patient::class, 'email'),
                Rule::unique(User::class, 'email'),
            ],
        ];
    }
}
