<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch_ID' => Branch::factory(),
            'PID' => Patient::factory(),
            'doctor_account_ID' => null,
            'visit_ID' => null,
            'created_by' => null,
            'branch_name' => fake()->city().' Clinic',
            'doctor_name' => null,
            'scheduled_at' => now()->nextWeekday()->setTime(9, 0),
            'appointment_type' => 'consultation',
            'concern' => fake()->sentence(),
            'status' => 'pending',
            'remarks' => 'New appointment — awaiting approval',
        ];
    }

    public function service(): static
    {
        return $this->state(fn (): array => ['appointment_type' => 'service', 'concern' => null]);
    }
}
