<?php

namespace Database\Factories;

use App\Models\PatientMedication;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientMedication>
 */
class PatientMedicationFactory extends Factory
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
            'medication' => fake()->randomElement(['Doxycycline', 'Hydrocortisone Cream 1%', 'Tranexamic Acid']),
            'dosage' => fake()->optional()->randomElement(['100mg', 'Thin layer', '250mg']),
            'frequency' => fake()->optional()->randomElement(['Once daily', 'Twice daily']),
            'duration' => fake()->optional()->randomElement(['2 weeks', '3 months', '6 months']),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
