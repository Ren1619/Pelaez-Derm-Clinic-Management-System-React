<?php

namespace App\Services\Appointments;

use App\Models\Appointment;
use App\Models\PatientVisit;
use App\Models\StaffAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StartAppointmentVisitService
{
    public function start(Appointment $appointment, ?int $doctorId = null): PatientVisit
    {
        return DB::transaction(function () use ($appointment, $doctorId): PatientVisit {
            $locked = Appointment::query()->with('services')->lockForUpdate()->findOrFail($appointment->appointment_ID);

            if ($locked->visit_ID !== null) {
                return PatientVisit::query()->findOrFail($locked->visit_ID);
            }

            if (! $locked->scheduled_at->isToday() || $locked->status !== 'today') {
                throw ValidationException::withMessages([
                    'appointment' => 'Only an approved appointment scheduled for today can start a visit.',
                ]);
            }

            $selectedDoctorId = $doctorId ?? $locked->doctor_account_ID;
            $doctor = $selectedDoctorId === null
                ? null
                : StaffAccount::query()->with('role')->find($selectedDoctorId);

            if ($selectedDoctorId !== null) {
                if ($doctor === null || ! $doctor->is_active || mb_strtolower($doctor->role->role_name) !== 'doctor') {
                    throw ValidationException::withMessages(['doctor_account_ID' => 'The assigned doctor must be active.']);
                }
                if ($doctor->branch_ID !== null && $doctor->branch_ID !== $locked->branch_ID) {
                    throw ValidationException::withMessages(['doctor_account_ID' => 'The doctor is assigned to a different clinic.']);
                }
            }

            $visit = PatientVisit::query()->create([
                'PID' => $locked->PID,
                'branch_ID' => $locked->branch_ID,
                'doctor_account_ID' => $doctor?->account_ID,
                'branch_name' => $locked->branch_name,
                'doctor_name' => $doctor?->full_name,
                'visited_at' => now(),
                'status' => 'in_progress',
            ]);

            foreach ($locked->services as $service) {
                $visit->services()->create([
                    'service_ID' => $service->service_ID,
                    'service_name' => $service->service_name,
                    'quantity' => 1,
                    'note' => 'Scheduled from appointment #'.$locked->appointment_ID,
                ]);
            }

            $locked->update([
                'doctor_account_ID' => $doctor?->account_ID,
                'doctor_name' => $doctor?->full_name,
                'visit_ID' => $visit->visit_ID,
                'status' => 'today',
                'started_at' => now(),
            ]);

            return $visit;
        }, 3);
    }
}
