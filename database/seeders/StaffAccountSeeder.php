<?php

namespace Database\Seeders;

use App\Models\StaffAccount;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StaffAccountSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        StaffAccount::factory()->create([
            'branch_ID' => null,
            'role_ID' => 1,
            'first_name' => 'System',
            'middle_name' => null,
            'last_name' => 'Administrator',
            'contact_number' => '09000000000',
            'email' => 'staff-admin@example.com',
        ]);
    }
}
