<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_name' => fake()->unique()->words(2, true),
            'category_type' => fake()->randomElement(['Product', 'Service']),
            'description' => fake()->sentence(),
        ];
    }

    public function product(): static
    {
        return $this->state(fn (): array => ['category_type' => 'Product']);
    }

    public function service(): static
    {
        return $this->state(fn (): array => ['category_type' => 'Service']);
    }
}
