<?php

namespace Database\Factories;

use App\Models\PatientVisitProduct;
use App\Models\PatientVisit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PatientVisitProduct>
 */
class PatientVisitProductFactory extends Factory
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
            'product_ID' => null,
            'product_name' => fake()->randomElement(['CeraVe Moisturizing Cream', 'Biore UV Aqua Rich SPF50']),
            'quantity' => fake()->numberBetween(1, 3),
            'unit_price' => fake()->randomFloat(2, 100, 1500),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
