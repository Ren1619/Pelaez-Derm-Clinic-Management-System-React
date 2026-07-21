<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\ExpenseCategory;
use App\Models\StaffAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Expense> */
class ExpenseFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'branch_ID' => Branch::factory(),
            'branch_name' => 'Clinic Branch',
            'category_ID' => ExpenseCategory::factory(),
            'category_name' => 'Clinic Supplies',
            'account_ID' => StaffAccount::factory(),
            'description' => fake()->sentence(4),
            'amount' => fake()->randomFloat(2, 100, 5000),
            'expense_date' => today(),
        ];
    }
}
