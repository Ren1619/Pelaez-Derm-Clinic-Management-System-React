<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\Service;
use App\Models\StaffAccount;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::query()->get();
        $patients = Patient::query()->take(8)->get();
        $services = Service::query()->take(4)->get();
        $doctors = StaffAccount::query()->whereHas('role', fn ($query) => $query->where('role_name', 'doctor'))->get();

        if ($branches->isEmpty() || $patients->isEmpty()) {
            return;
        }

        foreach ($patients as $index => $patient) {
            $branch = $branches[$index % $branches->count()];
            $doctor = $doctors->firstWhere('branch_ID', $branch->branch_ID) ?? $doctors->first();
            $scheduledAt = now()->addDays($index)->startOfDay()->addHours(9 + ($index % 6));
            if ($scheduledAt->isSunday()) {
                $scheduledAt->addDay();
            }

            $appointment = Appointment::query()->create([
                'branch_ID' => $branch->branch_ID,
                'PID' => $patient->PID,
                'doctor_account_ID' => $doctor?->account_ID,
                'branch_name' => $branch->branch_name,
                'doctor_name' => $doctor?->full_name,
                'scheduled_at' => $scheduledAt,
                'appointment_type' => $index % 2 === 0 ? 'consultation' : 'service',
                'concern' => $index % 2 === 0 ? 'Dermatology consultation and skin assessment.' : null,
                'status' => $scheduledAt->isToday() ? 'today' : 'upcoming',
                'remarks' => 'Seeded clinic appointment',
                'confirmed_at' => now(),
            ]);

            if ($appointment->appointment_type === 'service') {
                $services->take(2)->each(fn (Service $service) => $appointment->services()->create([
                    'service_ID' => $service->service_ID,
                    'service_name' => $service->name,
                ]));
            }
        }
    }
}
