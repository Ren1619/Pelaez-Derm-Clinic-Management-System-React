<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_ID' => Category::factory()->product(),
            'branch_ID' => Branch::factory(),
            'name' => fake()->unique()->words(3, true),
            'measurement_unit' => fake()->randomElement(['pcs', 'tube', 'ml']),
            'price' => fake()->randomFloat(2, 50, 5000),
            'quantity' => fake()->numberBetween(0, 100),
            'expiration_date' => fake()->dateTimeBetween('+1 month', '+2 years')->format('Y-m-d'),
            'product_img' => null,
        ];
    }
}
