<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Feedback;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feedback>
 */
class FeedbackFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'appointment_ID' => Appointment::factory()->state([
                'status' => 'completed',
                'completed_at' => now(),
            ]),
            'rating' => fake()->numberBetween(3, 5),
            'description' => fake()->optional(0.85)->paragraph(),
        ];
    }
}
