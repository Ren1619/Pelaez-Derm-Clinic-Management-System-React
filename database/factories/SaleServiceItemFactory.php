<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\SaleServiceItem> */
class SaleServiceItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 2);
        $price = fake()->randomFloat(2, 300, 3000);

        return [
            'sale_ID' => Sale::factory(),
            'service_ID' => Service::factory(),
            'service_name' => fake()->words(3, true),
            'quantity' => $quantity,
            'custom_price' => $price,
            'line_total' => $price * $quantity,
        ];
    }
}
