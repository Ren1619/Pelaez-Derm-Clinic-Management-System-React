<?php

namespace App\Services\Appointments;

use App\Models\Appointment;
use App\Models\SystemSetting;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AppointmentScheduleService
{
    public const CAPACITY_PER_SLOT = 2;

    private const SLOT_MINUTES = 60;

    /** @return list<array{value: string, label: string}> */
    public function slots(): array
    {
        $settings = SystemSetting::current();
        $opensAt = $this->settingTime((string) $settings->footer_opens_at);
        $closesAt = $this->settingTime((string) $settings->footer_closes_at);
        $slots = [];

        for ($startsAt = $opensAt; $startsAt->lessThan($closesAt); $startsAt = $endsAt) {
            $endsAt = $startsAt->addMinutes(self::SLOT_MINUTES);

            if ($endsAt->greaterThan($closesAt)) {
                $endsAt = $closesAt;
            }

            $slots[] = [
                'value' => $startsAt->format('H:i'),
                'label' => $startsAt->format('g:i A').' – '.$endsAt->format('g:i A'),
            ];
        }

        return $slots;
    }

    /** @return list<string> */
    public function slotValues(): array
    {
        return array_column($this->slots(), 'value');
    }

    /**
     * @return list<array{value: string, label: string, booked_count: int, remaining_capacity: int, is_available: bool}>
     */
    public function availability(int $branchId, CarbonImmutable $date, ?int $excludedAppointmentId = null): array
    {
        $appointments = Appointment::query()
            ->reservingSlot()
            ->where('branch_ID', $branchId)
            ->whereDate('scheduled_at', $date->toDateString())
            ->when($excludedAppointmentId, fn ($query, int $appointmentId) => $query->whereKeyNot($appointmentId))
            ->get(['scheduled_at']);
        $bookedCounts = $appointments->countBy(
            fn (Appointment $appointment): string => $appointment->scheduled_at->format('H:i'),
        );

        return array_map(function (array $slot) use ($bookedCounts): array {
            $bookedCount = (int) $bookedCounts->get($slot['value'], 0);
            $remainingCapacity = max(0, self::CAPACITY_PER_SLOT - $bookedCount);

            return [
                ...$slot,
                'booked_count' => $bookedCount,
                'remaining_capacity' => $remainingCapacity,
                'is_available' => $remainingCapacity > 0,
            ];
        }, $this->slots());
    }

    public function assertAvailable(
        int $branchId,
        CarbonImmutable $scheduledAt,
        ?int $excludedAppointmentId = null,
    ): void {
        if (! in_array($scheduledAt->format('H:i'), $this->slotValues(), true)) {
            throw ValidationException::withMessages([
                'scheduled_time' => 'Select a time slot within the clinic operating hours.',
            ]);
        }

        $bookedCount = Appointment::query()
            ->reservingSlot()
            ->where('branch_ID', $branchId)
            ->where('scheduled_at', $scheduledAt)
            ->when($excludedAppointmentId, fn ($query, int $appointmentId) => $query->whereKeyNot($appointmentId))
            ->count();

        if ($bookedCount >= self::CAPACITY_PER_SLOT) {
            throw ValidationException::withMessages([
                'scheduled_time' => 'This clinic time slot is fully booked. Select another time.',
            ]);
        }
    }

    public function withinSlotLock(int $branchId, CarbonImmutable $scheduledAt, Closure $callback): mixed
    {
        $key = "appointment-slot:{$branchId}:{$scheduledAt->format('YmdHi')}";

        return Cache::lock($key, 10)->block(5, $callback);
    }

    private function settingTime(string $time): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!H:i', mb_substr($time, 0, 5));
    }
}
