<?php

namespace Database\Factories;

use App\Models\SaleReturn;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\SaleReturnItem> */
class SaleReturnItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 2);
        $price = fake()->randomFloat(2, 50, 1000);

        return [
            'return_ID' => SaleReturn::factory(),
            'item_type' => 'product',
            'sale_item_ID' => fake()->numberBetween(1, 1000),
            'item_name' => fake()->words(3, true),
            'quantity_returned' => $quantity,
            'item_price' => $price,
            'subtotal' => $price * $quantity,
            'restocked' => true,
        ];
    }
}
