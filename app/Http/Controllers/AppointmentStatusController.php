<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelAppointmentRequest;
use App\Models\Appointment;
use App\Services\AppointmentNotificationService;
use App\Services\Appointments\AppointmentStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AppointmentStatusController extends Controller
{
    public function __construct(
        private AppointmentStatusService $statusService,
        private AppointmentNotificationService $notificationService,
    ) {}

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        Gate::authorize('update', $appointment);
        $validated = $request->validate(['action' => ['required', Rule::in(['approve', 'complete', 'incomplete'])]]);
        $this->statusService->{$validated['action']}($appointment);

        return back()->with('success', match ($validated['action']) {
            'approve' => 'Appointment approved.',
            'complete' => 'Appointment and patient visit completed.',
            default => 'Appointment marked incomplete.',
        });
    }

    public function cancel(CancelAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        Gate::authorize('update', $appointment);
        $this->statusService->cancel($appointment, (string) $request->string('cancellation_reason'));
        $this->notificationService->staffRejected($appointment->refresh(), $request->user(), (string) $request->string('cancellation_reason'));

        return back()->with('success', 'Appointment cancelled. The slot is available again.');
    }
}
