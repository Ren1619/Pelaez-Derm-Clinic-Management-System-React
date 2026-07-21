<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\StaffAccount;
use App\Services\Appointments\AppointmentManagementService;
use App\Services\Appointments\AppointmentPageService;
use App\Services\Appointments\AppointmentStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentPageService $pageService,
        private AppointmentManagementService $managementService,
        private AppointmentStatusService $statusService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Appointment::class);
        $this->statusService->sync();
        $validated = $request->validate([
            'status' => ['nullable', Rule::in([...Appointment::STATUSES, 'all'])],
            'branch_ID' => ['nullable', 'integer', Rule::exists('branches', 'branch_ID')],
            'appointment_type' => ['nullable', Rule::in([...Appointment::TYPES, 'all'])],
            'search' => ['nullable', 'string', 'max:100'],
            'month' => ['nullable', 'date_format:Y-m'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
        ]);
        $user = $request->user();
        $canViewAllBranches = ! $user instanceof StaffAccount || $user->isSuperAdmin();
        $branchId = $canViewAllBranches
            ? (isset($validated['branch_ID']) ? (int) $validated['branch_ID'] : null)
            : $user->branch_ID;
        $filters = [
            'status' => $validated['status'] ?? 'today',
            'branch_ID' => $branchId,
            'can_view_all_branches' => $canViewAllBranches,
            'appointment_type' => $validated['appointment_type'] ?? 'all',
            'search' => $validated['search'] ?? '',
            'month' => $validated['month'] ?? now()->format('Y-m'),
            'per_page' => (int) ($validated['per_page'] ?? 10),
        ];

        return Inertia::render('appointments/index', $this->pageService->payload($filters));
    }

    public function store(StoreAppointmentRequest $request): RedirectResponse
    {
        Gate::authorize('create', Appointment::class);
        $this->managementService->create($request->validated(), (int) $request->user()->getAuthIdentifier());

        return back()->with('success', 'Appointment scheduled.');
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        Gate::authorize('update', $appointment);
        $this->managementService->update($appointment, $request->validated());

        return back()->with('success', 'Appointment rescheduled and returned to pending approval.');
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        Gate::authorize('delete', $appointment);
        if ($appointment->visit_ID !== null || ! in_array($appointment->status, ['pending', 'cancelled'], true)) {
            return back()->withErrors(['appointment' => 'Only pending or cancelled appointments without a visit can be deleted.']);
        }
        $appointment->delete();

        return back()->with('success', 'Appointment deleted.');
    }
}
