<?php

namespace App\Services\Appointments;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\Service;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class AppointmentPageService
{
    /** @param array<string, mixed> $filters
     *  @return array<string, mixed>
     */
    public function payload(array $filters): array
    {
        $month = CarbonImmutable::createFromFormat('Y-m', $filters['month'])->startOfMonth();
        $query = Appointment::query()
            ->with(['patient:PID,first_name,middle_name,last_name,contact_number', 'doctor:account_ID,first_name,middle_name,last_name', 'services'])
            ->when($filters['status'] !== 'all', fn (Builder $builder) => $builder->where('status', $filters['status']))
            ->when($filters['branch_ID'], fn (Builder $builder, int $branchId) => $builder->where('branch_ID', $branchId))
            ->when($filters['appointment_type'] !== 'all', fn (Builder $builder) => $builder->where('appointment_type', $filters['appointment_type']))
            ->when($filters['search'], function (Builder $builder, string $search): void {
                $builder->where(function (Builder $nested) use ($search): void {
                    $nested->whereHas('patient', fn (Builder $patient) => $patient
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%"))
                        ->orWhere('concern', 'like', "%{$search}%")
                        ->orWhereHas('services', fn (Builder $service) => $service->where('service_name', 'like', "%{$search}%"));
                });
            });

        $appointments = $query->orderBy('scheduled_at')->paginate($filters['per_page'])->withQueryString();
        $calendarAppointments = Appointment::query()
            ->with(['patient:PID,first_name,middle_name,last_name,contact_number', 'doctor:account_ID,first_name,middle_name,last_name', 'services'])
            ->whereBetween('scheduled_at', [$month, $month->endOfMonth()])
            ->when($filters['branch_ID'], fn (Builder $builder, int $branchId) => $builder->where('branch_ID', $branchId))
            ->orderBy('scheduled_at')->get();

        return [
            'appointments' => $appointments->through(fn (Appointment $appointment): array => $this->serialize($appointment)),
            'calendarAppointments' => $calendarAppointments->map(fn (Appointment $appointment): array => $this->serialize($appointment))->all(),
            'summary' => collect(Appointment::STATUSES)->mapWithKeys(fn (string $status): array => [
                $status => Appointment::query()->where('status', $status)
                    ->when($filters['branch_ID'], fn (Builder $builder, int $branchId) => $builder->where('branch_ID', $branchId))->count(),
            ])->all(),
            'branches' => Branch::query()
                ->when(! $filters['can_view_all_branches'], fn (Builder $builder) => $builder->whereKey($filters['branch_ID']))
                ->orderBy('branch_name')
                ->get(['branch_ID', 'branch_name']),
            'patients' => Patient::query()->orderBy('last_name')->orderBy('first_name')->limit(500)->get()
                ->map(fn (Patient $patient): array => ['PID' => $patient->PID, 'full_name' => $patient->full_name, 'contact_number' => $patient->contact_number])->all(),
            'doctors' => StaffAccount::query()->where('is_active', true)
                ->when(! $filters['can_view_all_branches'], fn (Builder $builder) => $builder->where('branch_ID', $filters['branch_ID']))
                ->whereHas('role', fn (Builder $builder) => $builder->where('role_name', 'doctor'))
                ->orderBy('last_name')->get()->map(fn (StaffAccount $doctor): array => [
                    'account_ID' => $doctor->account_ID, 'full_name' => $doctor->full_name, 'branch_ID' => $doctor->branch_ID,
                ])->all(),
            'services' => Service::query()->orderBy('name')->get(['service_ID', 'name']),
            'timeSlots' => collect(Appointment::TIME_SLOTS)->map(fn (string $time): array => [
                'value' => $time,
                'label' => CarbonImmutable::createFromFormat('H:i', $time)->format('g:i A').' – '.CarbonImmutable::createFromFormat('H:i', $time)->addHour()->format('g:i A'),
            ])->all(),
            'filters' => $filters,
        ];
    }

    /** @return array<string, mixed> */
    public function serialize(Appointment $appointment): array
    {
        return [
            'appointment_ID' => $appointment->appointment_ID,
            'PID' => $appointment->PID,
            'patient_name' => $appointment->patient->full_name,
            'patient_contact' => $appointment->patient->contact_number ?? null,
            'branch_ID' => $appointment->branch_ID,
            'branch_name' => $appointment->branch_name,
            'doctor_account_ID' => $appointment->doctor_account_ID,
            'doctor_name' => $appointment->doctor_account_ID === null ? $appointment->doctor_name : $appointment->doctor?->full_name,
            'visit_ID' => $appointment->visit_ID,
            'scheduled_at' => $appointment->scheduled_at->toISOString(),
            'appointment_type' => $appointment->appointment_type,
            'concern' => $appointment->concern,
            'services' => $appointment->services->map(fn ($service): array => [
                'appointment_service_ID' => $service->appointment_service_ID,
                'service_ID' => $service->service_ID,
                'service_name' => $service->service_name,
            ])->all(),
            'status' => $appointment->status,
            'remarks' => $appointment->remarks,
            'cancellation_reason' => $appointment->cancellation_reason,
            'confirmed_at' => $appointment->confirmed_at?->toISOString(),
            'started_at' => $appointment->started_at?->toISOString(),
            'completed_at' => $appointment->completed_at?->toISOString(),
            'can_approve' => $appointment->status === 'pending',
            'can_edit' => $appointment->visit_ID === null && in_array($appointment->status, ['pending', 'upcoming', 'today', 'incomplete', 'cancelled'], true),
            'can_cancel' => $appointment->visit_ID === null && in_array($appointment->status, ['pending', 'upcoming', 'today'], true),
            'can_start' => $appointment->visit_ID === null && $appointment->scheduled_at->isToday() && in_array($appointment->status, ['pending', 'upcoming', 'today'], true),
            'can_complete' => $appointment->visit_ID !== null && $appointment->status === 'today',
        ];
    }
}
