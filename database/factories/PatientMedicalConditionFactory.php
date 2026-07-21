<?php

namespace Database\Factories;

use App\Models\PatientMedicalCondition;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientMedicalCondition>
 */
class PatientMedicalConditionFactory extends Factory
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
            'condition' => fake()->randomElement(['Acne Vulgaris', 'Atopic Dermatitis', 'Melasma']),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
