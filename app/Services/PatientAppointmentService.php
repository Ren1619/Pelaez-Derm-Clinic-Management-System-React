<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\Service;
use App\Services\Appointments\AppointmentPageService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class PatientAppointmentService
{
    public function __construct(private AppointmentPageService $pageService) {}

    /**
     * @param  array{status: string, appointment_type: string, search: string, per_page: int}  $filters
     * @return array<string, mixed>
     */
    public function payload(Patient $patient, array $filters): array
    {
        $appointments = $this->query($patient)
            ->when($filters['status'] !== 'all', fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['appointment_type'] !== 'all', fn (Builder $query) => $query->where('appointment_type', $filters['appointment_type']))
            ->when($filters['search'], function (Builder $query, string $search): void {
                $query->where(function (Builder $nested) use ($search): void {
                    $nested->where('branch_name', 'like', "%{$search}%")
                        ->orWhere('concern', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('services', fn (Builder $services) => $services->where('service_name', 'like', "%{$search}%"));
                });
            })
            ->latest('scheduled_at')
            ->paginate($filters['per_page'])
            ->withQueryString();

        return [
            'patient' => [
                'PID' => $patient->PID,
                'name' => $patient->full_name,
                'email' => $patient->email,
            ],
            'appointments' => $appointments->through(fn (Appointment $appointment): array => $this->pageService->serialize($appointment)),
            'summary' => collect(Appointment::STATUSES)->mapWithKeys(fn (string $status): array => [
                $status => $patient->appointments()->where('status', $status)->count(),
            ])->all(),
            'todayAppointments' => $this->query($patient)
                ->whereDate('scheduled_at', today())
                ->whereIn('status', ['pending', 'upcoming', 'today'])
                ->orderBy('scheduled_at')
                ->get()
                ->map(fn (Appointment $appointment): array => $this->pageService->serialize($appointment))
                ->all(),
            'branches' => Branch::query()->orderBy('branch_name')->get(['branch_ID', 'branch_name']),
            'services' => Service::query()->orderBy('name')->get(['service_ID', 'name']),
            'timeSlots' => collect(Appointment::TIME_SLOTS)->map(fn (string $time): array => [
                'value' => $time,
                'label' => CarbonImmutable::createFromFormat('H:i', $time)->format('g:i A').' – '.CarbonImmutable::createFromFormat('H:i', $time)->addHour()->format('g:i A'),
            ])->all(),
            'filters' => $filters,
        ];
    }

    /** @return Builder<Appointment> */
    private function query(Patient $patient): Builder
    {
        return Appointment::query()
            ->where('PID', $patient->PID)
            ->with([
                'patient:PID,first_name,middle_name,last_name,contact_number',
                'doctor:account_ID,first_name,middle_name,last_name',
                'services',
            ]);
    }
}
