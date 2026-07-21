<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SystemSetting extends Model
{
    /** @use HasFactory<\Database\Factories\SystemSettingFactory> */
    use HasFactory;

    /** @var list<string> */
    public const IMAGE_FIELDS = [
        'business_logo',
        'landing_hero_image',
        'landing_about_image',
        'services_hero_image',
        'branches_hero_image',
        'privacy_hero_image',
    ];

    protected $fillable = [
        'business_name',
        'business_logo',
        'landing_primary_tagline',
        'landing_secondary_tagline',
        'landing_year_started',
        'landing_hero_image',
        'landing_about_image',
        'landing_about_description',
        'landing_specializations',
        'landing_services_description',
        'landing_branches_description',
        'landing_contact_description',
        'business_email',
        'landing_cta_title',
        'landing_cta_description',
        'footer_days',
        'footer_opens_at',
        'footer_closes_at',
        'services_hero_image',
        'services_hero_description',
        'services_title',
        'services_description',
        'branches_hero_image',
        'branches_hero_description',
        'branches_title',
        'branches_description',
        'privacy_hero_image',
        'privacy_hero_description',
        'privacy_title',
        'privacy_description',
    ];

    protected $attributes = [
        'business_name' => 'Pelaez Dermatology Clinic',
        'business_logo' => null,
        'landing_primary_tagline' => 'Confidence begins with healthy skin',
        'landing_secondary_tagline' => 'Professional dermatology care made personal.',
        'landing_year_started' => 1990,
        'landing_hero_image' => null,
        'landing_about_image' => null,
        'landing_about_description' => 'We provide patient-centered dermatology care backed by experience and compassion.',
        'landing_specializations' => '["Clinical Dermatology","Cosmetic Dermatology","Skin Wellness"]',
        'landing_services_description' => 'Explore dermatology services designed around your skin health.',
        'landing_branches_description' => 'Visit the clinic branch most convenient for you.',
        'landing_contact_description' => 'Contact us to learn more or arrange a consultation.',
        'business_email' => 'clinic@example.com',
        'landing_cta_title' => 'Ready to care for your skin?',
        'landing_cta_description' => 'Book an appointment with our clinic today.',
        'footer_days' => 'Monday - Saturday',
        'footer_opens_at' => '08:00',
        'footer_closes_at' => '17:00',
        'services_title' => 'Our Services',
        'services_hero_image' => null,
        'services_hero_description' => null,
        'services_description' => null,
        'branches_title' => 'Our Branches',
        'branches_hero_image' => null,
        'branches_hero_description' => null,
        'branches_description' => null,
        'privacy_title' => 'Privacy Notice',
        'privacy_hero_image' => null,
        'privacy_hero_description' => null,
        'privacy_description' => null,
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

        unset($values['id'], $values['created_at'], $values['updated_at']);

        return $values;
    }

    protected function casts(): array
    {
        return [
            'landing_specializations' => 'array',
            'landing_year_started' => 'integer',
        ];
    }

    private function imageUrl(mixed $path): ?string
    {
        return is_string($path) && $path !== ''
            ? Storage::disk('public')->url($path)
            : null;
    }
}
