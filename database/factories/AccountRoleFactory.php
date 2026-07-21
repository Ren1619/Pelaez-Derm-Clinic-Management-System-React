<?php

namespace Database\Factories;

use App\Models\AccountRole;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AccountRole> */
class AccountRoleFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'role_name' => fake()->unique()->word(),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn (): array => ['role_name' => 'super_admin']);
    }

    public function admin(): static
    {
        return $this->state(fn (): array => ['role_name' => 'admin']);
    }

    public function staff(): static
    {
        return $this->state(fn (): array => ['role_name' => 'staff']);
    }

    public function doctor(): static
    {
        return $this->state(fn (): array => ['role_name' => 'doctor']);
    }
}
