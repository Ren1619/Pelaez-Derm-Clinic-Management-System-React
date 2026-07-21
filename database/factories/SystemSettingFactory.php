<?php

namespace Database\Factories;

use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SystemSetting>
 */
class SystemSettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_name' => 'Pelaez Dermatology Clinic',
            'business_logo' => null,
            'landing_primary_tagline' => fake()->sentence(5),
            'landing_secondary_tagline' => fake()->sentence(),
            'landing_year_started' => 1990,
            'landing_hero_image' => null,
            'landing_about_image' => null,
            'landing_about_description' => fake()->paragraph(),
            'landing_specializations' => ['Clinical Dermatology', 'Cosmetic Dermatology'],
            'landing_services_description' => fake()->sentence(),
            'landing_branches_description' => fake()->sentence(),
            'landing_contact_description' => fake()->sentence(),
            'business_email' => fake()->companyEmail(),
            'landing_cta_title' => fake()->sentence(4),
            'landing_cta_description' => fake()->sentence(),
            'footer_days' => 'Monday - Saturday',
            'footer_opens_at' => '08:00',
            'footer_closes_at' => '17:00',
            'services_hero_image' => null,
            'services_title' => 'Our Services',
            'branches_hero_image' => null,
            'branches_title' => 'Our Branches',
            'privacy_hero_image' => null,
            'privacy_title' => 'Privacy Notice',
        ];
    }
}
