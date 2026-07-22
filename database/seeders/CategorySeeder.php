<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MajorServiceCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $timestamp = now();

        MajorServiceCategory::query()->upsert([
            [
                'major_service_category_ID' => 1,
                'name' => 'Pathological',
                'description' => 'Medical dermatology services focused on diagnosing and treating skin conditions and diseases.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'major_service_category_ID' => 2,
                'name' => 'Aesthetic',
                'description' => 'Clinically guided procedures that improve skin appearance, texture, and overall presentation.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'major_service_category_ID' => 3,
                'name' => 'Cosmetic',
                'description' => 'Beauty-focused treatments and non-medical enhancements for the skin and face.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ], ['major_service_category_ID'], [
            'name',
            'description',
            'updated_at',
        ]);

        Category::query()->upsert([
            [
                'category_ID' => 1,
                'category_name' => 'Facial Treatments',
                'category_type' => 'Service',
                'major_service_category_ID' => 3,
                'description' => 'Skin care and facial treatment services offered by the clinic.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 2,
                'category_name' => 'Laser Procedures',
                'category_type' => 'Service',
                'major_service_category_ID' => 2,
                'description' => 'Advanced laser-based dermatological procedures.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 3,
                'category_name' => 'Consultations',
                'category_type' => 'Service',
                'major_service_category_ID' => 1,
                'description' => 'Medical and cosmetic dermatology consultations.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 4,
                'category_name' => 'Moisturizers',
                'category_type' => 'Product',
                'major_service_category_ID' => null,
                'description' => 'Hydrating and barrier-repair skincare products.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 5,
                'category_name' => 'Sunscreen',
                'category_type' => 'Product',
                'major_service_category_ID' => null,
                'description' => 'SPF protection products for daily skin defense.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'category_ID' => 6,
                'category_name' => 'Prescription Creams',
                'category_type' => 'Product',
                'major_service_category_ID' => null,
                'description' => 'Doctor-prescribed topical treatments.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ], ['category_ID'], [
            'category_name',
            'category_type',
            'major_service_category_ID',
            'description',
            'updated_at',
        ]);
    }
}
