<?php

namespace Database\Factories;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    protected $model = ActivityLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'actor_type' => 'staff',
            'actor_ID' => fake()->numberBetween(1, 1000),
            'actor_name' => fake()->name(),
            'actor_email' => fake()->safeEmail(),
            'actor_role' => 'staff',
            'actor_branch_ID' => fake()->numberBetween(1, 5),
            'action' => fake()->randomElement(['created', 'viewed', 'updated', 'deleted']),
            'context' => fake()->randomElement(array_keys(ActivityLog::contextLabels())),
            'subject_type' => 'Record',
            'subject_ID' => (string) fake()->numberBetween(1, 1000),
            'subject_label' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'old_values' => null,
            'new_values' => null,
            'request_method' => 'POST',
            'route_name' => 'records.store',
            'url' => '/records',
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }
}
