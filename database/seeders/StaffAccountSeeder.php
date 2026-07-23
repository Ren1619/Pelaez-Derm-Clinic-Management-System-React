<?php

namespace Database\Seeders;

use App\Models\AccountRole;
use App\Models\Branch;
use App\Models\StaffAccount;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StaffAccountSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $roles = AccountRole::query()->pluck('role_ID', 'role_name');
        $password = 'Password123!';

        StaffAccount::query()->updateOrCreate(
            ['email' => 'superadmin@gmail.com'],
            [
                'branch_ID' => null,
                'role_ID' => $roles->get('super_admin'),
                'first_name' => 'System',
                'middle_name' => null,
                'last_name' => 'Administrator',
                'contact_number' => '09000000000',
                'email_verified_at' => now(),
                'is_active' => true,
                'password' => $password,
            ],
        );

        Branch::query()->orderBy('branch_ID')->get()->each(function (Branch $branch) use ($password, $roles): void {
            $branchSlug = str($branch->branch_name)->before(' City')->lower()->slug();
            $branchNumber = str_pad((string) $branch->branch_ID, 2, '0', STR_PAD_LEFT);

            foreach (['admin', 'staff', 'doctor'] as $roleIndex => $roleName) {
                $displayRole = str($roleName)->headline()->toString();

                StaffAccount::query()->updateOrCreate(
                    ['email' => "{$roleName}.{$branchSlug}@pelaez.test"],
                    [
                        'branch_ID' => $branch->branch_ID,
                        'role_ID' => $roles->get($roleName),
                        'first_name' => $displayRole,
                        'middle_name' => null,
                        'last_name' => $branch->branch_name,
                        'contact_number' => '0917'.$branchNumber.str_pad((string) $roleIndex, 5, '0', STR_PAD_LEFT),
                        'email_verified_at' => now(),
                        'is_active' => true,
                        'password' => $password,
                    ],
                );
            }
        });
    }
}
