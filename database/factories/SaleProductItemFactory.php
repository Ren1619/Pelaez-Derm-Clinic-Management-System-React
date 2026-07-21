<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\SaleProductItem> */
class SaleProductItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 4);
        $price = fake()->randomFloat(2, 50, 1000);

        return [
            'sale_ID' => Sale::factory(),
            'product_ID' => Product::factory(),
            'product_name' => fake()->words(3, true),
            'measurement_unit' => 'pcs',
            'quantity' => $quantity,
            'unit_price' => $price,
            'line_total' => $price * $quantity,
        ];
    }
}
