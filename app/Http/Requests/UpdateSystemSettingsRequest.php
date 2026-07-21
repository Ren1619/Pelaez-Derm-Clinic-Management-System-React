<?php

namespace App\Http\Requests;

use App\Enums\StaffModule;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class UpdateSystemSettingsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_array($this->input('landing_specializations'))) {
            $this->merge([
                'landing_specializations' => collect($this->input('landing_specializations'))
                    ->filter(fn (mixed $value): bool => is_string($value) && trim($value) !== '')
                    ->map(fn (string $value): string => trim($value))
                    ->values()
                    ->all(),
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            || ($user instanceof StaffAccount
                && $user->is_active
                && $user->canAccessModule(StaffModule::SystemSettings));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $text = ['nullable', 'string', 'max:1000', 'regex:/^[^<>{}]*$/u'];
        $requiredText = ['required', 'string', 'max:255', 'regex:/^[^<>{}]*$/u'];
        $image = ['nullable', File::types(['jpg', 'jpeg', 'png', 'webp', 'svg'])->max('5mb')];

        return match ($this->route('section')) {
            'landing' => [
                'landing_primary_tagline' => $requiredText,
                'landing_secondary_tagline' => $requiredText,
                'landing_year_started' => ['required', 'integer', 'min:1900', 'max:'.now()->year],
                'landing_hero_image_file' => $image,
                'remove_landing_hero_image' => ['sometimes', 'boolean'],
                'landing_about_image_file' => $image,
                'remove_landing_about_image' => ['sometimes', 'boolean'],
                'landing_about_description' => ['required', ...$text],
                'landing_specializations' => ['required', 'array', 'min:1', 'max:3'],
                'landing_specializations.*' => $requiredText,
                'landing_services_description' => ['required', ...$text],
                'landing_branches_description' => ['required', ...$text],
                'landing_contact_description' => ['required', ...$text],
                'business_email' => ['required', 'email', 'max:255'],
                'landing_cta_title' => $requiredText,
                'landing_cta_description' => ['required', ...$text],
                'footer_days' => ['required', 'string', 'max:255', 'regex:/^[\pL\s,\-–]+$/u'],
                'footer_opens_at' => ['required', 'date_format:H:i'],
                'footer_closes_at' => ['required', 'date_format:H:i', 'after:footer_opens_at'],
            ],
            'services' => [
                'services_hero_image_file' => $image,
                'remove_services_hero_image' => ['sometimes', 'boolean'],
                'services_hero_description' => $text,
                'services_title' => $requiredText,
                'services_description' => $text,
            ],
            'branches' => [
                'branches_hero_image_file' => $image,
                'remove_branches_hero_image' => ['sometimes', 'boolean'],
                'branches_hero_description' => $text,
                'branches_title' => $requiredText,
                'branches_description' => $text,
            ],
            'privacy' => [
                'privacy_hero_image_file' => $image,
                'remove_privacy_hero_image' => ['sometimes', 'boolean'],
                'privacy_hero_description' => $text,
                'privacy_title' => $requiredText,
                'privacy_description' => ['required', ...$text],
            ],
            'business' => [
                'business_name' => $requiredText,
                'business_logo_file' => $image,
                'remove_business_logo' => ['sometimes', 'boolean'],
            ],
            default => [],
        };
    }
}
