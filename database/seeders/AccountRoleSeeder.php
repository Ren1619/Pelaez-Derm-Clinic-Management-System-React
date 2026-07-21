<?php

namespace Database\Seeders;

use App\Models\AccountRole;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountRoleSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $timestamp = now();

        AccountRole::query()->upsert([
            ['role_ID' => 1, 'role_name' => 'super_admin', 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['role_ID' => 2, 'role_name' => 'admin', 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['role_ID' => 3, 'role_name' => 'staff', 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['role_ID' => 4, 'role_name' => 'doctor', 'created_at' => $timestamp, 'updated_at' => $timestamp],
        ], ['role_ID'], ['role_name', 'updated_at']);
    }
}
