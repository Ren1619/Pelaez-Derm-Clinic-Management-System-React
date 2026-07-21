<?php

namespace Database\Factories;

use App\Models\PatientVisitDiagnosis;
use App\Models\PatientVisit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientVisitDiagnosis>
 */
class PatientVisitDiagnosisFactory extends Factory
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
            'diagnosis' => fake()->randomElement(['Acne Vulgaris', 'Atopic Dermatitis', 'Melasma']),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
