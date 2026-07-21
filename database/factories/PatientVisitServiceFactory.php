<?php

namespace Database\Factories;

use App\Models\PatientVisitService;
use App\Models\PatientVisit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientVisitService>
 */
class PatientVisitServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'visit_ID' => PatientVisit::factory(),
            'service_ID' => null,
            'service_name' => fake()->randomElement(['Initial Dermatology Consultation', 'Hydra Facial', 'Laser Toning']),
            'quantity' => 1,
            'note' => fake()->optional()->sentence(),
        ];
    }
}
