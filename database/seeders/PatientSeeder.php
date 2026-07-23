<?php

namespace Database\Seeders;

use App\Models\Patient;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patients = [
            ['Juan', 'M.', 'Dela Cruz', 'juan.delacruz@pelaez.test', '09301234567', 'Poblacion, Valencia City', 'Male', '1990-04-15', 'Single'],
            ['Maria', null, 'Santos', 'maria.santos@pelaez.test', '09311234567', 'Casisang, Malaybalay City', 'Female', '1985-11-22', 'Married'],
            ['Carlo', 'T.', 'Ramos', 'carlo.ramos@pelaez.test', '09321234567', 'Lumina Homes, Valencia City', 'Male', '2000-07-08', 'Single'],
            ['Lisa', 'K.', 'Tan', 'lisa.tan@pelaez.test', '09331234567', 'Sumpong, Malaybalay City', 'Female', '1995-02-28', 'Single'],
            ['Angela', 'R.', 'Flores', 'angela.flores@pelaez.test', '09341234567', 'Bagontaas, Valencia City', 'Female', '1998-06-12', 'Single'],
            ['Miguel', 'A.', 'Reyes', 'miguel.reyes@pelaez.test', '09351234567', 'Kalilangan, Bukidnon', 'Male', '1978-09-03', 'Married'],
            ['Sofia', 'L.', 'Garcia', 'sofia.garcia@pelaez.test', '09361234567', 'San Jose, Malaybalay City', 'Female', '2002-01-19', 'Single'],
            ['Paolo', null, 'Mendoza', 'paolo.mendoza@pelaez.test', '09371234567', 'Maramag, Bukidnon', 'Male', '1988-12-01', 'Married'],
            ['Nicole', 'C.', 'Lim', 'nicole.lim@pelaez.test', '09381234567', 'Poblacion, Valencia City', 'Female', '1993-03-26', 'Single'],
            ['Gabriel', 'S.', 'Torres', 'gabriel.torres@pelaez.test', '09391234567', 'Impalambong, Malaybalay City', 'Male', '1999-10-10', 'Single'],
            ['Patricia', null, 'Aquino', 'patricia.aquino@pelaez.test', '09401234567', 'Musuan, Maramag', 'Female', '1982-05-05', 'Widowed'],
            ['Enzo', 'D.', 'Navarro', 'patient.demo@pelaez.test', '09411234567', 'Mailag, Valencia City', 'Male', '1996-08-17', 'Single'],
        ];

        foreach ($patients as [$firstName, $middleName, $lastName, $email, $contactNumber, $address, $sex, $dateOfBirth, $civilStatus]) {
            Patient::query()->updateOrCreate(
                ['email' => $email],
                [
                    'password' => 'Patient123!',
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
