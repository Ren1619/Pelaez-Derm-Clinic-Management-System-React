<?php

namespace Database\Factories;

use App\Models\PatientAllergy;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientAllergy>
 */
class PatientAllergyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'PID' => Patient::factory(),
            'allergy' => fake()->randomElement(['Penicillin', 'Nickel', 'Fragrance']),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
