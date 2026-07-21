<?php

namespace App\Http\Controllers;

use App\Http\Requests\StartAppointmentVisitRequest;
use App\Models\Appointment;
use App\Services\Appointments\StartAppointmentVisitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class StartAppointmentVisitController extends Controller
{
    public function __construct(private StartAppointmentVisitService $startVisitService) {}

    public function __invoke(StartAppointmentVisitRequest $request, Appointment $appointment): RedirectResponse
    {
        Gate::authorize('update', $appointment);
        $visit = $this->startVisitService->start($appointment, $request->integer('doctor_account_ID') ?: null);

        return redirect()->route('patients.show', ['patient' => $appointment->PID, 'visit' => $visit->visit_ID])
            ->with('success', 'Patient visit started from appointment.');
    }
}
