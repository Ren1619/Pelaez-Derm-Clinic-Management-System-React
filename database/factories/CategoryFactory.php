<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\MajorServiceCategory;
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
            'category_type' => 'Product',
            'major_service_category_ID' => null,
            'description' => fake()->sentence(),
        ];
    }

    public function product(): static
    {
        return $this->state(fn (): array => [
            'category_type' => 'Product',
            'major_service_category_ID' => null,
        ]);
    }

    public function service(): static
    {
        return $this->state(fn (): array => [
            'category_type' => 'Service',
            'major_service_category_ID' => MajorServiceCategory::factory(),
        ]);
    }
}
