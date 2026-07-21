<?php

namespace Database\Factories;

use App\Models\AccountRole;
use App\Models\Branch;
use App\Models\StaffAccount;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/** @extends Factory<StaffAccount> */
class StaffAccountFactory extends Factory
{
    protected static ?string $password;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'branch_ID' => Branch::factory(),
            'role_ID' => AccountRole::factory()->staff(),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional()->firstName(),
            'last_name' => fake()->lastName(),
            'contact_number' => fake()->numerify('09#########'),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'is_active' => true,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (): array => ['email_verified_at' => null]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn (): array => [
            'branch_ID' => null,
            'role_ID' => AccountRole::factory()->superAdmin(),
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (): array => ['role_ID' => AccountRole::factory()->admin()]);
    }

    public function staff(): static
    {
        return $this->state(fn (): array => ['role_ID' => AccountRole::factory()->staff()]);
    }

    public function doctor(): static
    {
        return $this->state(fn (): array => ['role_ID' => AccountRole::factory()->doctor()]);
    }
}
