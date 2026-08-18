<?php

namespace App\Http\Requests;

use App\Enums\StaffModule;
use App\Models\StaffAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class UpdateSystemSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof StaffAccount
            && $user->is_active
            && $user->canAccessModule(StaffModule::SystemSettings);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $safeTextPattern = 'regex:/^[^<>{}]*$/u';
        $title = ['required', 'string', 'max:80', $safeTextPattern];
        $image = ['nullable', File::types(['jpg', 'jpeg', 'png', 'webp', 'svg'])->max('5mb')];

        return match ($this->route('section')) {
            'landing' => [
                'landing_primary_tagline' => ['required', 'string', 'max:80', $safeTextPattern],
                'landing_secondary_tagline' => ['required', 'string', 'max:140', $safeTextPattern],
                'landing_services_title' => $title,
                'landing_about_title' => $title,
                'landing_branches_title' => $title,
                'landing_contact_title' => $title,
                'landing_year_started' => ['required', 'integer', 'min:1900', 'max:'.now()->year],
                'landing_hero_image_file' => $image,
                'remove_landing_hero_image' => ['sometimes', 'boolean'],
                'landing_about_image_file' => $image,
                'remove_landing_about_image' => ['sometimes', 'boolean'],
                'landing_about_description' => ['required', 'string', 'max:449', $safeTextPattern],
                'landing_branches_image_file' => $image,
                'remove_landing_branches_image' => ['sometimes', 'boolean'],
                'landing_contact_description' => ['required', 'string', 'max:240', $safeTextPattern],
                'business_email' => ['required', 'email', 'max:255'],
                'landing_cta_title' => $title,
                'landing_cta_description' => ['required', 'string', 'max:240', $safeTextPattern],
                'footer_days' => ['required', 'string', 'max:60', 'regex:/^[\pL\s,\-–]+$/u'],
                'footer_opens_at' => ['required', 'date_format:H:i'],
                'footer_closes_at' => ['required', 'date_format:H:i', 'after:footer_opens_at'],
            ],
            'services' => [
                'services_title' => $title,
            ],
            'branches' => [
                'branches_title' => $title,
            ],
            'privacy' => [
                'privacy_title' => $title,
                'privacy_sections' => ['required', 'array', 'min:1', 'max:12'],
                'privacy_sections.*.title' => ['required', 'string', 'max:120', $safeTextPattern],
                'privacy_sections.*.content' => ['required', 'string', 'max:2000', $safeTextPattern],
            ],
            'business' => [
                'business_name' => ['required', 'string', 'max:80', $safeTextPattern],
                'business_logo_file' => $image,
                'remove_business_logo' => ['sometimes', 'boolean'],
            ],
            default => [],
        };
    }
}
