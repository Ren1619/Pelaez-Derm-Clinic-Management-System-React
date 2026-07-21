<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\ExpenseCategory> */
class ExpenseCategoryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['category_name' => fake()->unique()->words(2, true)];
    }
}
