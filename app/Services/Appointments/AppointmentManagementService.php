<?php

namespace App\Services\Appointments;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Service;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentManagementService
{
    /** @param array<string, mixed> $data */
    public function create(array $data, ?int $createdBy): Appointment
    {
        return DB::transaction(function () use ($data, $createdBy): Appointment {
            return $this->persist(new Appointment, $data, $createdBy);
        }, 3);
    }

    /** @param array<string, mixed> $data */
    public function update(Appointment $appointment, array $data): Appointment
    {
        if ($appointment->visit_ID !== null || ! in_array($appointment->status, ['pending', 'upcoming', 'today', 'incomplete', 'cancelled'], true)) {
            throw ValidationException::withMessages(['appointment' => 'This appointment can no longer be rescheduled.']);
        }

        return DB::transaction(function () use ($appointment, $data): Appointment {
            $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->appointment_ID);

            return $this->persist($locked, $data, $locked->created_by);
        }, 3);
    }

    /** @param array<string, mixed> $data */
    private function persist(Appointment $appointment, array $data, ?int $createdBy): Appointment
    {
        $branch = Branch::query()->findOrFail($data['branch_ID']);
        $doctor = empty($data['doctor_account_ID']) ? null : StaffAccount::query()->with('role')->findOrFail($data['doctor_account_ID']);
        $scheduledAt = CarbonImmutable::createFromFormat('Y-m-d H:i', $data['scheduled_date'].' '.$data['scheduled_time']);

        if ($doctor !== null && (! $doctor->is_active || mb_strtolower($doctor->role->role_name) !== 'doctor')) {
            throw ValidationException::withMessages(['doctor_account_ID' => 'Select an active doctor.']);
        }

        if ($doctor?->branch_ID !== null && $doctor->branch_ID !== $branch->branch_ID) {
            throw ValidationException::withMessages(['doctor_account_ID' => 'The doctor is assigned to a different clinic.']);
        }

        $bookedCount = Appointment::query()
            ->where('branch_ID', $branch->branch_ID)
            ->where('scheduled_at', $scheduledAt)
            ->where('status', '!=', 'cancelled')
            ->when($appointment->exists, fn ($query) => $query->whereKeyNot($appointment->getKey()))
            ->lockForUpdate()
            ->count();

        if ($bookedCount >= 2) {
            throw ValidationException::withMessages(['scheduled_time' => 'This clinic time slot is fully booked.']);
        }

        $appointment->fill([
            'branch_ID' => $branch->branch_ID,
            'PID' => $data['PID'],
            'doctor_account_ID' => $doctor?->account_ID,
            'created_by' => $appointment->created_by ?? $createdBy,
            'branch_name' => $branch->branch_name,
            'doctor_name' => $doctor?->full_name,
            'scheduled_at' => $scheduledAt,
            'appointment_type' => $data['appointment_type'],
            'concern' => $data['appointment_type'] === 'consultation' ? $data['concern'] : null,
            'status' => 'pending',
            'remarks' => Arr::get($data, 'remarks') ?: ($appointment->exists ? 'Staff rescheduled appointment — awaiting approval' : 'New appointment — awaiting approval'),
            'cancellation_reason' => null,
            'confirmed_at' => null,
            'cancelled_at' => null,
        ])->save();

        $appointment->services()->get()->each->delete();
        if ($data['appointment_type'] === 'service') {
            Service::query()->whereKey($data['service_ids'])->orderBy('name')->get()->each(
                fn (Service $service) => $appointment->services()->create([
                    'service_ID' => $service->service_ID,
                    'service_name' => $service->name,
                ]),
            );
        }

        return $appointment->refresh()->load(['patient', 'branch', 'doctor', 'services']);
    }
}
