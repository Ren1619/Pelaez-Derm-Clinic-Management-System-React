<?php

namespace Database\Factories;

use App\Models\PatientVisitPrescription;
use App\Models\PatientVisit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientVisitPrescription>
 */
class PatientVisitPrescriptionFactory extends Factory
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
            'prescription' => fake()->randomElement(['Tretinoin 0.025% Cream', 'Doxycycline', 'Hydrocortisone Cream 1%']),
            'dosage' => fake()->randomElement(['100mg', 'Thin layer', 'Pea-sized amount']),
            'frequency' => fake()->randomElement(['Once daily', 'Twice daily', 'Once nightly']),
            'duration' => fake()->randomElement(['2 weeks', '8 weeks', '3 months']),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
