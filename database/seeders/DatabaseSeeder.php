<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(BranchSeeder::class);
        $this->call(AccountRoleSeeder::class);
        $this->call(StaffAccountSeeder::class);
        $this->call(CategorySeeder::class);
        $this->call(ServiceSeeder::class);
        $this->call(ProductSeeder::class);
        $this->call(PatientSeeder::class);
        $this->call(PatientClinicalRecordSeeder::class);
        $this->call(AppointmentSeeder::class);
        $this->call(FeedbackSeeder::class);
        $this->call(PosSeeder::class);
        $this->call(DistributionSeeder::class);
        $this->call(ActivityLogSeeder::class);
    }
}
