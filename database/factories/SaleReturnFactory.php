<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\StaffAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\SaleReturn> */
class SaleReturnFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'sale_ID' => Sale::factory(),
            'return_type' => 'partial',
            'return_amount' => fake()->randomFloat(2, 50, 500),
            'return_reason' => fake()->sentence(),
            'refund_method' => 'cash',
            'processed_by' => StaffAccount::factory(),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
