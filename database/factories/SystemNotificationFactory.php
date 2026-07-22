<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\SystemNotification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SystemNotification>
 */
class SystemNotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sender_id' => null,
            'sender_type' => 'staff',
            'receiver_id' => Patient::factory(),
            'receiver_type' => 'patient',
            'branch_id' => null,
            'appointment_id' => null,
            'type' => 'appointment_reminder',
            'deduplication_key' => null,
            'title' => 'Appointment approaching',
            'message' => fake()->sentence(),
            'reason' => null,
            'is_read' => false,
            'data' => ['sender_name' => 'Clinic Staff'],
        ];
    }
}
