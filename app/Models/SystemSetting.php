<?php

namespace App\Models;

use Database\Factories\SystemSettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SystemSetting extends Model
{
    /** @use HasFactory<SystemSettingFactory> */
    use HasFactory;

    /** @var list<string> */
    public const IMAGE_FIELDS = [
        'business_logo',
        'landing_hero_image',
        'landing_about_image',
        'landing_branches_image',
    ];

    protected $fillable = [
        'business_name',
        'business_logo',
        'landing_primary_tagline',
        'landing_secondary_tagline',
        'landing_services_title',
        'landing_about_title',
        'landing_branches_title',
        'landing_contact_title',
        'landing_year_started',
        'landing_hero_image',
        'landing_about_image',
        'landing_about_description',
        'landing_branches_image',
        'landing_contact_description',
        'business_email',
        'landing_cta_title',
        'landing_cta_description',
        'footer_days',
        'footer_opens_at',
        'footer_closes_at',
        'services_title',
        'branches_title',
        'privacy_title',
        'privacy_sections',
    ];

    protected $attributes = [
        'business_name' => 'Pelaez Dermatology Clinic',
        'business_logo' => null,
        'landing_primary_tagline' => 'Confidence begins with healthy skin',
        'landing_secondary_tagline' => 'Professional dermatology care made personal.',
        'landing_services_title' => 'Exceptional treatments, designed for you.',
        'landing_about_title' => 'Years of experience, devoted to you.',
        'landing_branches_title' => 'Find Us Near You.',
        'landing_contact_title' => 'Connect With Us',
        'landing_year_started' => 1990,
        'landing_hero_image' => null,
        'landing_about_image' => null,
        'landing_about_description' => 'We provide patient-centered dermatology care backed by experience and compassion.',
        'landing_specializations' => '[]',
        'landing_services_description' => '',
        'landing_branches_description' => '',
        'landing_branches_image' => null,
        'landing_contact_description' => 'Contact us to learn more or arrange a consultation.',
        'business_email' => 'clinic@example.com',
        'landing_cta_title' => 'Ready to care for your skin?',
        'landing_cta_description' => 'Book an appointment with our clinic today.',
        'footer_days' => 'Monday - Saturday',
        'footer_opens_at' => '08:00',
        'footer_closes_at' => '17:00',
        'services_title' => 'Our Services',
        'branches_title' => 'Our Branches',
        'privacy_title' => 'Privacy Notice',
        'privacy_sections' => '[]',
    ];

    public static function current(): self
    {
        return self::query()->first() ?? new self;
    }

    /** @return array<string, mixed> */
    public function toPublicArray(): array
    {
        $values = $this->attributesToArray();

        foreach (self::IMAGE_FIELDS as $field) {
            $values["{$field}_url"] = $this->imageUrl($this->getAttribute($field));
        }

        $privacySections = is_array($values['privacy_sections'] ?? null)
            ? $values['privacy_sections']
            : [];

        if ($privacySections === []
            && is_string($values['privacy_description'] ?? null)
            && $values['privacy_description'] !== '') {
            $privacySections = [[
                'title' => 'Privacy Notice',
                'content' => $values['privacy_description'],
            ]];
        }

        $values['privacy_sections'] = $privacySections;

        unset(
            $values['id'],
            $values['created_at'],
            $values['updated_at'],
            $values['landing_specializations'],
            $values['landing_services_description'],
            $values['landing_branches_description'],
            $values['services_hero_image'],
            $values['services_hero_description'],
            $values['branches_hero_image'],
            $values['branches_hero_description'],
            $values['services_description'],
            $values['branches_description'],
            $values['privacy_hero_image'],
            $values['privacy_hero_description'],
            $values['privacy_description'],
        );

        return $values;
    }

    protected function casts(): array
    {
        return [
            'landing_specializations' => 'array',
            'landing_year_started' => 'integer',
            'privacy_sections' => 'array',
        ];
    }

    private function imageUrl(mixed $path): ?string
    {
        return is_string($path) && $path !== ''
            ? Storage::disk('public')->url($path)
            : null;
    }
}
