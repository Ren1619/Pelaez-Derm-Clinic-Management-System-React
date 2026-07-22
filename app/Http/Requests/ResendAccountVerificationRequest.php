<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates an email submitted to the resend-verification form.
 */
class ResendAccountVerificationRequest extends FormRequest
{
    /**
     * Allow guests to request another verification email.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validate the email used to locate the account.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return ['email' => ['required', 'string', 'email', 'max:255']];
    }
}
