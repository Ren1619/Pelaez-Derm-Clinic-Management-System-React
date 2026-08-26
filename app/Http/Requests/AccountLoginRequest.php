<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Validates credentials and enforces the shared account login lockout.
 */
class AccountLoginRequest extends FormRequest
{
    public const MAX_ATTEMPTS = 5;

    public const LOCKOUT_SECONDS = 300;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'accepted'],
        ];
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! $this->isRateLimited()) {
            return;
        }

        $this->throwLockoutValidationException();
    }

    public function hitRateLimiter(): void
    {
        RateLimiter::hit($this->throttleKey(), self::LOCKOUT_SECONDS);
    }

    public function clearRateLimiter(): void
    {
        RateLimiter::clear($this->throttleKey());
    }

    public function isRateLimited(): bool
    {
        return RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS);
    }

    public function throttleKey(): string
    {
        return 'account-login:'.Str::transliterate(
            Str::lower($this->string('email')->toString()).'|'.$this->ip(),
        );
    }

    public function throwLockoutValidationException(): never
    {
        $seconds = max(RateLimiter::availableIn($this->throttleKey()), 1);

        throw ValidationException::withMessages([
            'email' => 'Too many login attempts. Please try again later.',
            'lockout_seconds' => (string) $seconds,
        ]);
    }
}
