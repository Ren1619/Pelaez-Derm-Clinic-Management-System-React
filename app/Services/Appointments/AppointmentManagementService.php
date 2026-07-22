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
    public function __construct(private AppointmentScheduleService $scheduleService) {}

    /** @param array<string, mixed> $data */
    public function create(array $data, ?int $createdBy): Appointment
    {
        $scheduledAt = $this->scheduledAt($data);

        return $this->scheduleService->withinSlotLock(
            (int) $data['branch_ID'],
            $scheduledAt,
            fn (): Appointment => DB::transaction(
                fn (): Appointment => $this->persist(new Appointment, $data, $createdBy, $scheduledAt),
                3,
            ),
        );
    }

    /** @param array<string, mixed> $data */
    public function patientReschedule(Appointment $appointment, array $data): Appointment
    {
        $scheduledAt = $this->scheduledAt($data);

        return $this->scheduleService->withinSlotLock(
            (int) $data['branch_ID'],
            $scheduledAt,
            fn (): Appointment => DB::transaction(function () use ($appointment, $data, $scheduledAt): Appointment {
                $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->appointment_ID);
                $this->assertPatientCanReschedule($locked);

                return $this->persist($locked, $data, $locked->created_by, $scheduledAt);
            }, 3),
        );
    }

    /** @param array{scheduled_date: string, scheduled_time: string, reschedule_reason: string} $data */
    public function requestReschedule(Appointment $appointment, array $data): Appointment
    {
        $scheduledAt = $this->scheduledAt($data);

        return $this->scheduleService->withinSlotLock(
            (int) $appointment->branch_ID,
            $scheduledAt,
            fn (): Appointment => DB::transaction(function () use ($appointment, $data, $scheduledAt): Appointment {
                $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->appointment_ID);

                if ($locked->visit_ID !== null || ! in_array($locked->status, ['pending', 'reschedule_requested', 'upcoming', 'today'], true)) {
                    throw ValidationException::withMessages([
                        'appointment' => 'This appointment can no longer be rescheduled.',
                    ]);
                }

                $this->scheduleService->assertAvailable(
                    (int) $locked->branch_ID,
                    $scheduledAt,
                    $locked->appointment_ID,
                );

                $locked->update([
                    'previous_scheduled_at' => $locked->scheduled_at,
                    'scheduled_at' => $scheduledAt,
                    'status' => 'reschedule_requested',
                    'remarks' => 'Clinic proposed a new schedule — awaiting patient response.',
                    'reschedule_reason' => $data['reschedule_reason'],
                    'reschedule_requested_at' => now(),
                    'reschedule_responded_at' => null,
                    'confirmed_at' => null,
                    'cancellation_reason' => null,
                    'cancelled_at' => null,
                ]);

                return $locked->refresh()->load(['patient', 'branch', 'doctor', 'services']);
            }, 3),
        );
    }

    public function acceptReschedule(Appointment $appointment): Appointment
    {
        return DB::transaction(function () use ($appointment): Appointment {
            $locked = Appointment::query()->lockForUpdate()->findOrFail($appointment->appointment_ID);

            if ($locked->status !== 'reschedule_requested') {
                throw ValidationException::withMessages([
                    'appointment' => 'This appointment does not have a reschedule request to accept.',
                ]);
            }

            $locked->update([
                'status' => 'pending',
                'remarks' => 'Patient accepted the proposed schedule — awaiting clinic approval.',
                'reschedule_responded_at' => now(),
            ]);

            return $locked->refresh()->load(['patient', 'branch', 'doctor', 'services']);
        }, 3);
    }

    /** @param array<string, mixed> $data */
    private function persist(
        Appointment $appointment,
        array $data,
        ?int $createdBy,
        CarbonImmutable $scheduledAt,
    ): Appointment {
        $branch = Branch::query()->findOrFail((int) $data['branch_ID']);
        $doctor = empty($data['doctor_account_ID'])
            ? null
            : StaffAccount::query()->with('role')->findOrFail((int) $data['doctor_account_ID']);

        if ($doctor !== null && (! $doctor->is_active || mb_strtolower($doctor->role->role_name) !== 'doctor')) {
            throw ValidationException::withMessages(['doctor_account_ID' => 'Select an active doctor.']);
        }

        if ($doctor?->branch_ID !== null && $doctor->branch_ID !== $branch->branch_ID) {
            throw ValidationException::withMessages(['doctor_account_ID' => 'The doctor is assigned to a different clinic.']);
        }

        $this->scheduleService->assertAvailable(
            $branch->branch_ID,
            $scheduledAt,
            $appointment->exists ? $appointment->appointment_ID : null,
        );

        $wasExisting = $appointment->exists;
        $wasRespondingToStaff = $appointment->status === 'reschedule_requested';
        $previousScheduledAt = $wasExisting
            && $appointment->previous_scheduled_at === null
            && ! $appointment->scheduled_at->equalTo($scheduledAt)
                ? $appointment->scheduled_at
                : $appointment->previous_scheduled_at;

        $appointment->fill([
            'branch_ID' => $branch->branch_ID,
            'PID' => $data['PID'],
            'doctor_account_ID' => $doctor?->account_ID,
            'created_by' => $appointment->created_by ?? $createdBy,
            'branch_name' => $branch->branch_name,
            'doctor_name' => $doctor?->full_name,
            'scheduled_at' => $scheduledAt,
            'previous_scheduled_at' => $previousScheduledAt,
            'appointment_type' => $data['appointment_type'],
            'concern' => $data['appointment_type'] === 'consultation' ? $data['concern'] : null,
            'status' => 'pending',
            'remarks' => Arr::get($data, 'remarks') ?: ($wasExisting
                ? 'Patient submitted a new schedule — awaiting clinic approval.'
                : 'New appointment — awaiting approval.'),
            'reschedule_responded_at' => $wasRespondingToStaff ? now() : $appointment->reschedule_responded_at,
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

    private function assertPatientCanReschedule(Appointment $appointment): void
    {
        if ($appointment->visit_ID !== null || ! in_array($appointment->status, ['pending', 'reschedule_requested', 'upcoming'], true)) {
            throw ValidationException::withMessages([
                'appointment' => 'This appointment can no longer be rescheduled.',
            ]);
        }
    }

    /** @param array<string, mixed> $data */
    private function scheduledAt(array $data): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat(
            'Y-m-d H:i',
            $data['scheduled_date'].' '.$data['scheduled_time'],
        );
    }
}
