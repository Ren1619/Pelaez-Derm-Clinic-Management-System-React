<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $timestamp = now();

        Service::query()->upsert([
            [
                'service_ID' => 1,
                'category_ID' => 3,
                'name' => 'Initial Dermatology Consultation',
                'description' => 'First-time skin assessment and personalized treatment planning with a licensed dermatologist.',
                'service_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'service_ID' => 2,
                'category_ID' => 3,
                'name' => 'Follow-up Consultation',
                'description' => 'Review of treatment progress and adjustment of care plan.',
                'service_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'service_ID' => 3,
                'category_ID' => 1,
                'name' => 'Hydra Facial',
                'description' => 'Multi-step facial treatment including cleansing, exfoliation, extraction, and hydration.',
                'service_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'service_ID' => 4,
                'category_ID' => 1,
                'name' => 'Chemical Peel',
                'description' => 'Application of a chemical solution to exfoliate and improve skin texture and tone.',
                'service_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'service_ID' => 5,
                'category_ID' => 2,
                'name' => 'Laser Toning',
                'description' => 'Low-energy laser treatment targeting pigmentation, brightening and evening out skin tone.',
                'service_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'service_ID' => 6,
                'category_ID' => 2,
                'name' => 'CO2 Laser Resurfacing',
                'description' => 'Ablative laser treatment for acne scars, fine lines, and skin rejuvenation.',
                'service_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ], ['service_ID'], [
            'category_ID',
            'name',
            'description',
            'service_img',
            'updated_at',
        ]);
    }
}
