<?php

namespace Database\Factories;

use App\Models\Distribution;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Distribution>
 */
class DistributionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'from_branch_ID' => Branch::factory(),
            'to_branch_ID' => Branch::factory(),
            'created_by' => null,
            'status' => Distribution::Pending,
            'scheduled_date' => fake()->optional()->dateTimeBetween('now', '+1 month'),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function inTransit(): static
    {
        return $this->state(fn (): array => ['status' => Distribution::InTransit, 'sent_date' => now()]);
    }

    public function delivered(): static
    {
        return $this->state(fn (): array => [
            'status' => Distribution::Delivered,
            'sent_date' => now()->subHour(),
            'received_date' => now(),
        ]);
    }
}
