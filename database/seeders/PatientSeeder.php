<?php

namespace Database\Seeders;

use App\Models\Patient;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PatientSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patients = [
            ['Juan', 'M.', 'Dela Cruz', 'juan.delacruz@email.com', '09301234567', '12 Sampaguita St., Quezon City', 'Male', '1990-04-15', 'Single'],
            ['Maria', null, 'Santos', 'maria.santos@email.com', '09311234567', '34 Malaya Ave., Makati City', 'Female', '1985-11-22', 'Married'],
            ['Carlo', 'T.', 'Ramos', 'carlo.ramos@email.com', '09321234567', '78 Mabini Rd., Pasig City', 'Male', '2000-07-08', 'Single'],
            ['Lisa', 'K.', 'Tan', 'lisa.tan@email.com', '09331234567', '56 Orchid St., Mandaluyong City', 'Female', '1995-02-28', 'Single'],
        ];

        foreach ($patients as $index => [$firstName, $middleName, $lastName, $email, $contactNumber, $address, $sex, $dateOfBirth, $civilStatus]) {
            Patient::query()->updateOrCreate(
                ['email' => $email],
                [
                    'password' => Hash::make(sprintf('Patient@%03d', $index + 1)),
                    'email_verified_at' => now(),
                    'contact_number' => $contactNumber,
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'address' => $address,
                    'sex' => $sex,
                    'date_of_birth' => $dateOfBirth,
                    'civil_status' => $civilStatus,
                ],
            );
        }
    }
}
