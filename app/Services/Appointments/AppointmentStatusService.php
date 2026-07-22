<?php

namespace App\Services\Appointments;

use App\Models\Appointment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentStatusService
{
    public function sync(): int
    {
        $changed = Appointment::query()->whereIn('status', ['pending', 'reschedule_requested', 'upcoming', 'today'])->get();

        foreach ($changed as $appointment) {
            if ($appointment->scheduled_at->isBefore(today())) {
                $appointment->update([
                    'status' => $appointment->visit_ID === null
                        ? (in_array($appointment->status, ['pending', 'reschedule_requested'], true) ? 'cancelled' : 'incomplete')
                        : $appointment->status,
                    'cancelled_at' => in_array($appointment->status, ['pending', 'reschedule_requested'], true) ? now() : $appointment->cancelled_at,
                    'cancellation_reason' => in_array($appointment->status, ['pending', 'reschedule_requested'], true)
                        ? 'Automatically cancelled after the unapproved schedule passed.'
                        : $appointment->cancellation_reason,
                ]);
            } elseif ($appointment->scheduled_at->isToday() && $appointment->status === 'upcoming') {
                $appointment->update(['status' => 'today']);
            }
        }

        return $changed->count();
    }

    public function approve(Appointment $appointment): void
    {
        if ($appointment->status !== 'pending') {
            throw ValidationException::withMessages(['appointment' => 'Only pending appointments can be approved.']);
        }

        $appointment->update([
            'status' => $appointment->scheduled_at->isToday() ? 'today' : 'upcoming',
            'confirmed_at' => now(),
        ]);
    }

    public function cancel(Appointment $appointment, string $reason): void
    {
        if ($appointment->visit_ID !== null || ! in_array($appointment->status, ['pending', 'reschedule_requested', 'upcoming', 'today'], true)) {
            throw ValidationException::withMessages(['appointment' => 'This appointment can no longer be cancelled.']);
        }

        $appointment->update(['status' => 'cancelled', 'cancellation_reason' => $reason, 'cancelled_at' => now()]);
    }

    public function complete(Appointment $appointment): void
    {
        if ($appointment->visit_ID === null) {
            throw ValidationException::withMessages(['appointment' => 'Start the patient visit before completing this appointment.']);
        }

        DB::transaction(function () use ($appointment): void {
            $appointment->visit()->update(['status' => 'completed', 'finalized_at' => now()]);
            $appointment->update(['status' => 'completed', 'completed_at' => now()]);
        });
    }

    public function incomplete(Appointment $appointment): void
    {
        if ($appointment->visit_ID !== null || ! in_array($appointment->status, ['today', 'upcoming'], true)) {
            throw ValidationException::withMessages(['appointment' => 'Only an unstarted scheduled appointment can be marked incomplete.']);
        }

        $appointment->update(['status' => 'incomplete']);
    }
}
