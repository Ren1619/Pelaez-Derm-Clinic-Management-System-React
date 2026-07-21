<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Patient;
use App\Models\StaffAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Sale> */
class SaleFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 100, 5000);
        $discount = fake()->randomElement([0, 0, 5, 10]);
        $discountAmount = round($subtotal * ($discount / 100), 2);
        $total = $subtotal - $discountAmount;

        return [
            'invoice_number' => 'INV-'.now()->format('Ymd').'-'.fake()->unique()->bothify('??####'),
            'branch_ID' => Branch::factory(),
            'branch_name' => 'Clinic Branch',
            'PID' => Patient::factory(),
            'processed_by' => StaffAccount::factory(),
            'customer_name' => fake()->name(),
            'date' => today(),
            'subtotal_cost' => $subtotal,
            'discount_perc' => $discount,
            'discount_amount' => $discountAmount,
            'total_cost' => $total,
            'pay_method' => fake()->randomElement(['cash', 'card', 'ewallet']),
            'amount_received' => $total,
            'change_amount' => 0,
            'finalized' => true,
            'is_voided' => false,
        ];
    }
}
