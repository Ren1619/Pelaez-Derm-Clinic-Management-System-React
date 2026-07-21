<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_ID' => Category::factory()->service(),
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->paragraph(),
            'service_img' => null,
        ];
    }
}
