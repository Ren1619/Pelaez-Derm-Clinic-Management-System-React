<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class DashboardService
{
    /** @param array<string, mixed> $validated
     *  @return array<string, mixed>
     */
    public function payload(StaffAccount|User $user, array $validated): array
    {
        $canViewAllBranches = $user instanceof User || $user->isSuperAdmin();
        $branchId = $canViewAllBranches
            ? (isset($validated['branch_ID']) ? (int) $validated['branch_ID'] : null)
            : $user->branch_ID;
        $selectedDate = CarbonImmutable::createFromFormat(
            'Y-m-d',
            $validated['date'] ?? now()->format('Y-m-d'),
        )->startOfDay();
        $month = CarbonImmutable::createFromFormat(
            'Y-m',
            $validated['month'] ?? $selectedDate->format('Y-m'),
        )->startOfMonth();
        $calendarStart = $month->startOfWeek(CarbonImmutable::SUNDAY);
        $calendarEnd = $month->endOfMonth()->endOfWeek(CarbonImmutable::SATURDAY);
        $today = CarbonImmutable::today();

        $appointmentCounts = Appointment::query()
            ->selectRaw('DATE(scheduled_at) as appointment_date, COUNT(*) as aggregate')
            ->whereBetween('scheduled_at', [$calendarStart, $calendarEnd->endOfDay()])
            ->where(function (Builder $query) use ($today): void {
                $query->where(function (Builder $todayQuery) use ($today): void {
                    $todayQuery->whereDate('scheduled_at', $today)->where('status', 'today');
                })->orWhere(function (Builder $upcomingQuery) use ($today): void {
                    $upcomingQuery->whereDate('scheduled_at', '!=', $today)->where('status', 'upcoming');
                });
            })
            ->when($branchId, fn (Builder $query, int $selectedBranchId) => $query->where('branch_ID', $selectedBranchId))
            ->groupBy('appointment_date')
            ->pluck('aggregate', 'appointment_date');

        $selectedAppointments = Appointment::query()
            ->select(['appointment_ID', 'PID', 'branch_name', 'scheduled_at', 'status'])
            ->with('patient:PID,first_name,middle_name,last_name')
            ->whereDate('scheduled_at', $selectedDate)
            ->where('status', $selectedDate->isToday() ? 'today' : 'upcoming')
            ->when($branchId, fn (Builder $query, int $selectedBranchId) => $query->where('branch_ID', $selectedBranchId))
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'appointment_ID' => $appointment->appointment_ID,
                'PID' => $appointment->PID,
                'patient_name' => $appointment->patient?->full_name ?? 'Unknown Patient',
                'time' => $appointment->scheduled_at->format('g:i A'),
                'status' => $appointment->status,
                'branch_name' => $appointment->branch_name,
            ])
            ->all();

        $calendarDays = [];
        for ($day = $calendarStart; $day->lessThanOrEqualTo($calendarEnd); $day = $day->addDay()) {
            $date = $day->format('Y-m-d');
            $calendarDays[] = [
                'date' => $date,
                'day' => $day->day,
                'is_current_month' => $day->month === $month->month,
                'is_today' => $day->isToday(),
                'appointment_count' => (int) ($appointmentCounts[$date] ?? 0),
            ];
        }

        $assignedBranch = $user instanceof StaffAccount ? $user->branch : null;
        $settings = SystemSetting::current()->toPublicArray();

        return [
            'welcome' => [
                'name' => $user instanceof StaffAccount ? $user->full_name : $user->name,
                'branch_name' => $assignedBranch?->branch_name,
                'business_name' => $settings['business_name'],
                'banner_image_url' => $settings['landing_hero_image_url'],
            ],
            'branches' => $canViewAllBranches
                ? Branch::query()->orderBy('branch_name')->get(['branch_ID', 'branch_name'])
                    ->map(fn (Branch $branch): array => [
                        'branch_ID' => $branch->branch_ID,
                        'branch_name' => $branch->branch_name,
                    ])->all()
                : [],
            'filters' => [
                'month' => $month->format('Y-m'),
                'date' => $selectedDate->format('Y-m-d'),
                'branch_ID' => $branchId,
                'can_view_all_branches' => $canViewAllBranches,
            ],
            'calendar' => [
                'month_name' => $month->format('F'),
                'year' => $month->year,
                'days' => $calendarDays,
            ],
            'selected_appointments' => $selectedAppointments,
        ];
    }
}
