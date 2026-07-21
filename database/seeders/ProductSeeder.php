<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $timestamp = now();

        Product::query()->upsert([
            [
                'product_ID' => 1,
                'category_ID' => 4,
                'branch_ID' => 1,
                'name' => 'CeraVe Moisturizing Cream',
                'measurement_unit' => 'pcs',
                'price' => 450.00,
                'quantity' => 50,
                'expiration_date' => '2027-06-01',
                'product_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'product_ID' => 2,
                'category_ID' => 5,
                'branch_ID' => 1,
                'name' => 'Biore UV Aqua Rich SPF50',
                'measurement_unit' => 'pcs',
                'price' => 380.00,
                'quantity' => 30,
                'expiration_date' => '2026-12-01',
                'product_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'product_ID' => 3,
                'category_ID' => 6,
                'branch_ID' => 1,
                'name' => 'Tretinoin 0.025% Cream',
                'measurement_unit' => 'tube',
                'price' => 650.00,
                'quantity' => 20,
                'expiration_date' => '2027-01-15',
                'product_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'product_ID' => 4,
                'category_ID' => 4,
                'branch_ID' => 2,
                'name' => 'CeraVe Moisturizing Cream',
                'measurement_unit' => 'pcs',
                'price' => 450.00,
                'quantity' => 25,
                'expiration_date' => '2027-06-01',
                'product_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'product_ID' => 5,
                'category_ID' => 5,
                'branch_ID' => 2,
                'name' => 'Altruist SPF50 Sunscreen',
                'measurement_unit' => 'pcs',
                'price' => 200.00,
                'quantity' => 40,
                'expiration_date' => '2027-03-01',
                'product_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ], ['product_ID'], [
            'category_ID',
            'branch_ID',
            'name',
            'measurement_unit',
            'price',
            'quantity',
            'expiration_date',
            'product_img',
            'updated_at',
        ]);
    }
}
