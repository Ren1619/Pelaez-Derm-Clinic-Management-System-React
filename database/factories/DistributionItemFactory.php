<?php

namespace Database\Factories;

use App\Models\DistributionItem;
use App\Models\Distribution;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DistributionItem>
 */
class DistributionItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'distribution_ID' => Distribution::factory(),
            'product_ID' => Product::factory(),
            'category_ID' => null,
            'product_name' => fake()->words(3, true),
            'category_name' => fake()->word(),
            'measurement_unit' => 'pcs',
            'quantity' => fake()->numberBetween(1, 10),
            'price' => fake()->randomFloat(2, 50, 500),
            'expiration_date' => fake()->dateTimeBetween('+1 month', '+1 year'),
            'product_img' => null,
        ];
    }
}
