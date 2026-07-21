<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch_name' => fake()->unique()->city().' Branch',
            'branch_location' => fake()->streetAddress().', '.fake()->city(),
            'contact_number' => fake()->numerify('09#########'),
            'map_link' => fake()->url(),
            'fb_link' => fake()->optional()->url(),
            'branch_img' => null,
        ];
    }
}
