<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $timestamp = now();

        Category::query()->upsert([
            [
                'category_ID' => 1,
                'category_name' => 'Facial Treatments',
                'category_type' => 'Service',
                'description' => 'Skin care and facial treatment services offered by the clinic.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 2,
                'category_name' => 'Laser Procedures',
                'category_type' => 'Service',
                'description' => 'Advanced laser-based dermatological procedures.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 3,
                'category_name' => 'Consultations',
                'category_type' => 'Service',
                'description' => 'Medical and cosmetic dermatology consultations.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 4,
                'category_name' => 'Moisturizers',
                'category_type' => 'Product',
                'description' => 'Hydrating and barrier-repair skincare products.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 5,
                'category_name' => 'Sunscreen',
                'category_type' => 'Product',
                'description' => 'SPF protection products for daily skin defense.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 6,
                'category_name' => 'Prescription Creams',
                'category_type' => 'Product',
                'description' => 'Doctor-prescribed topical treatments.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ], ['category_ID'], [
            'category_name',
            'category_type',
            'description',
            'updated_at',
        ]);
    }
}
