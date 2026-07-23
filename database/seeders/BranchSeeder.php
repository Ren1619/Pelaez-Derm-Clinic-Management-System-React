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
                'latitude' => 8.1551839,
                'longitude' => 125.1276898,
                'contact_number' => '09176399041',
                'map_link' => 'https://www.google.com/maps/place/Fortich+St,+Malaybalay+City,+Bukidnon/@8.1546357,125.1281215,3a,75y,236.51h,74.1t/data=!3m7!1e1!3m5!1sNMBcS8wT0Z4af-gdjqH-fw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D15.902696613562227%26panoid%3DNMBcS8wT0Z4af-gdjqH-fw%26yaw%3D236.50847376819422!7i16384!8i8192!4m7!3m6!1s0x32ffa987899869fd:0x7e78db5f6c918889!8m2!3d8.1551839!4d125.1276898!10e5!16s%2Fg%2F1pv0tbbmt?entry=ttu&g_ep=EgoyMDI2MDcxOS4wIKXMDSoASAFQAw%3D%3D',
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
