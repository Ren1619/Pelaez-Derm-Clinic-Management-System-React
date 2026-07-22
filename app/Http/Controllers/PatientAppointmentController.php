<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelPatientAppointmentRequest;
use App\Http\Requests\SavePatientAppointmentRequest;
use App\Models\Appointment;
use App\Models\Patient;
use App\Services\AppointmentNotificationService;
use App\Services\Appointments\AppointmentManagementService;
use App\Services\Appointments\AppointmentStatusService;
use App\Services\PatientAppointmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PatientAppointmentController extends Controller
{
    public function __construct(
        private PatientAppointmentService $pageService,
        private AppointmentManagementService $managementService,
        private AppointmentStatusService $statusService,
        private AppointmentNotificationService $notificationService,
    ) {}

    public function index(Request $request): Response
    {
        $this->statusService->sync();
        $validated = $request->validate([
            'status' => ['nullable', Rule::in([...Appointment::STATUSES, 'all'])],
            'appointment_type' => ['nullable', Rule::in([...Appointment::TYPES, 'all'])],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
            'service_ID' => ['nullable', 'integer', Rule::exists('services', 'service_ID')],
        ]);
        $filters = [
            'status' => $validated['status'] ?? 'all',
            'appointment_type' => $validated['appointment_type'] ?? 'all',
            'search' => $validated['search'] ?? '',
            'per_page' => (int) ($validated['per_page'] ?? 10),
        ];

        return Inertia::render('patient/appointments/index', [
            ...$this->pageService->payload($this->patient($request), $filters),
            'initialServiceId' => isset($validated['service_ID']) ? (int) $validated['service_ID'] : null,
        ]);
    }

    public function store(SavePatientAppointmentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $patient = $this->patient($request);
        $appointment = $this->managementService->create([
            ...$data,
            'PID' => $patient->PID,
            'doctor_account_ID' => null,
            'remarks' => 'Patient requested appointment — awaiting approval.',
        ], null);
        $this->notificationService->patientCreated($appointment, $patient);

        return back()->with('success', 'Appointment request submitted for clinic approval.');
    }

    public function update(SavePatientAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->ensureOwned($request, $appointment);
        $data = $request->validated();
        $updated = $this->managementService->update($appointment, [
            ...$data,
            'PID' => $this->patient($request)->PID,
            'doctor_account_ID' => null,
            'remarks' => $data['reschedule_reason'] ?? 'Patient rescheduled appointment — awaiting approval.',
        ]);
        $this->notificationService->patientUpdated($updated, $this->patient($request), $data['reschedule_reason'] ?? null);

        return back()->with('success', 'Appointment rescheduled and returned for clinic approval.');
    }

    public function cancel(CancelPatientAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->ensureOwned($request, $appointment);
        $this->statusService->cancel($appointment, $request->string('reason')->toString());
        $this->notificationService->patientUpdated($appointment->refresh(), $this->patient($request), $request->string('reason')->toString());

        return back()->with('success', 'Appointment cancelled.');
    }

    public function destroy(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->ensureOwned($request, $appointment);

        if ($appointment->visit_ID !== null || ! in_array($appointment->status, ['completed', 'cancelled'], true)) {
            return back()->withErrors(['appointment' => 'Only completed or cancelled appointments without a linked visit can be deleted.']);
        }

        $appointment->delete();

        return back()->with('success', 'Appointment removed from your history.');
    }

    private function patient(Request $request): Patient
    {
        $patient = $request->user('patient');

        abort_unless($patient instanceof Patient, 401);

        return $patient;
    }

    private function ensureOwned(Request $request, Appointment $appointment): void
    {
        abort_unless($appointment->PID === $this->patient($request)->PID, 404);
    }
}
