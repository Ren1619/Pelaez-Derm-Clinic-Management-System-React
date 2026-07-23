<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Service;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $services = Service::query()->orderBy('service_ID')->get();
        $doctors = StaffAccount::query()
            ->whereHas('role', fn ($query) => $query->where('role_name', 'doctor'))
            ->get()
            ->keyBy('branch_ID');
        $creators = StaffAccount::query()
            ->whereHas('role', fn ($query) => $query->where('role_name', 'staff'))
            ->get()
            ->keyBy('branch_ID');

        PatientVisit::query()->with('services')->orderBy('visited_at')->get()
            ->each(function (PatientVisit $visit) use ($creators, $doctors): void {
                $doctor = $doctors->get($visit->branch_ID);
                $scheduledAt = $visit->visited_at->copy()->subMinutes(30);
                $appointment = Appointment::query()->updateOrCreate(
                    ['visit_ID' => $visit->visit_ID],
                    [
                        'branch_ID' => $visit->branch_ID,
                        'PID' => $visit->PID,
                        'doctor_account_ID' => $doctor?->account_ID,
                        'created_by' => $creators->get($visit->branch_ID)?->account_ID,
                        'branch_name' => $visit->branch_name,
                        'doctor_name' => $doctor?->full_name,
                        'scheduled_at' => $scheduledAt,
                        'appointment_type' => 'service',
                        'concern' => 'Scheduled dermatology treatment and follow-up assessment.',
                        'status' => 'completed',
                        'remarks' => 'Completed seeded appointment linked to a clinical visit.',
                        'confirmed_at' => $scheduledAt->copy()->subDay(),
                        'started_at' => $visit->visited_at,
                        'completed_at' => $visit->finalized_at,
                    ],
                );

                foreach ($visit->services as $visitService) {
                    $appointment->services()->updateOrCreate(
                        ['service_ID' => $visitService->service_ID],
                        ['service_name' => $visitService->service_name],
                    );
                }
            });

        $branches = Branch::query()->orderBy('branch_ID')->get();
        $patients = Patient::query()->where('email', 'like', '%@pelaez.test')->orderBy('PID')->get();
        $statuses = ['today', 'pending', 'upcoming', 'reschedule_requested', 'cancelled', 'incomplete'];

        foreach ($patients as $index => $patient) {
            $branch = $branches[$index % $branches->count()];
            $doctor = $doctors->get($branch->branch_ID);
            $status = $statuses[$index % count($statuses)];
            $scheduledAt = $status === 'today'
                ? CarbonImmutable::today()->addHours(9 + ($index % 5))
                : CarbonImmutable::today()->addDays(2 + $index)->addHours(9 + ($index % 5));
            $appointment = Appointment::query()->updateOrCreate(
                ['PID' => $patient->PID, 'scheduled_at' => $scheduledAt],
                [
                    'branch_ID' => $branch->branch_ID,
                    'doctor_account_ID' => $doctor?->account_ID,
                    'created_by' => $creators->get($branch->branch_ID)?->account_ID,
                    'branch_name' => $branch->branch_name,
                    'doctor_name' => $doctor?->full_name,
                    'appointment_type' => $index % 3 === 0 ? 'consultation' : 'service',
                    'concern' => $index % 3 === 0 ? 'Skin assessment and treatment-plan consultation.' : null,
                    'status' => $status,
                    'remarks' => 'Seeded appointment for workflow and access testing.',
                    'previous_scheduled_at' => $status === 'reschedule_requested' ? $scheduledAt->subDays(2) : null,
                    'reschedule_reason' => $status === 'reschedule_requested' ? 'Patient requested a later appointment.' : null,
                    'reschedule_requested_at' => $status === 'reschedule_requested' ? now()->subDay() : null,
                    'confirmed_at' => in_array($status, ['today', 'upcoming'], true) ? now()->subDay() : null,
                    'cancelled_at' => $status === 'cancelled' ? now()->subDay() : null,
                    'cancellation_reason' => $status === 'cancelled' ? 'Schedule conflict reported by patient.' : null,
                ],
            );

            if ($appointment->appointment_type === 'service' && $services->isNotEmpty()) {
                $service = $services[$index % $services->count()];
                $appointment->services()->updateOrCreate(
                    ['service_ID' => $service->service_ID],
                    ['service_name' => $service->name],
                );
            }
        }
    }
}
