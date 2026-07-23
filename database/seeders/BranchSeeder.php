<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $timestamp = now();

        Branch::query()->upsert([
            [
                'branch_ID' => 1,
                'branch_name' => 'Valencia City',
                'branch_location' => 'Roxas Street, Valencia City, Bukidnon',
                'latitude' => 7.9075,
                'longitude' => 125.0942,
                'contact_number' => '09353719162',
                'map_link' => 'https://maps.app.goo.gl/1N7rBAga4AAwGGdQ6',
                'fb_link' => null,
                'branch_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'branch_ID' => 2,
                'branch_name' => 'Malaybalay City',
                'branch_location' => '3rd floor, Carillo Bldg., Sayre Highway, Fortich St. Malaybalay City.',
                'latitude' => 8.1575,
                'longitude' => 125.1277,
                'contact_number' => '09176399041',
                'map_link' => 'https://maps.app.goo.gl/s2XXMzVUuhykYgxM7',
                'fb_link' => null,
                'branch_img' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ], ['branch_ID'], [
            'branch_name',
            'branch_location',
            'latitude',
            'longitude',
            'contact_number',
            'map_link',
            'fb_link',
            'branch_img',
            'updated_at',
        ]);
    }
}
