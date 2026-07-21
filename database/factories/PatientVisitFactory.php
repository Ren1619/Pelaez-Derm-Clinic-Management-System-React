<?php

namespace Database\Factories;

use App\Models\PatientVisit;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientVisit>
 */
class PatientVisitFactory extends Factory
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
            'branch_ID' => null,
            'doctor_account_ID' => null,
            'branch_name' => fake()->city().' Clinic',
            'doctor_name' => 'Dr. '.fake()->name(),
            'visited_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'blood_pressure' => fake()->optional()->randomElement(['110/70', '120/80', '130/85']),
            'weight' => fake()->optional()->randomFloat(2, 40, 120),
            'height' => fake()->optional()->randomFloat(2, 140, 200),
            'status' => 'completed',
            'finalized_at' => now(),
        ];
    }
}
