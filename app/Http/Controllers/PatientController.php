<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use App\Services\PatientManagementService;
use App\Services\PatientClinicalRecordService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function __construct(
        private PatientManagementService $patientManagementService,
        private PatientClinicalRecordService $patientClinicalRecordService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Patient::class);

        $filters = $this->filters($request);
        $patients = $this->patientManagementService
            ->paginate($filters)
            ->through(fn (Patient $patient): array => $this->serializePatient($patient));

        return Inertia::render('patients/index', [
            'patients' => $patients,
            'filters' => $filters,
            'summary' => [
                'total' => Patient::query()->count(),
                'verified' => Patient::query()->whereNotNull('email_verified_at')->count(),
                'unverified' => Patient::query()->whereNull('email_verified_at')->count(),
            ],
        ]);
    }

    public function store(StorePatientRequest $request): RedirectResponse
    {
        $this->patientManagementService->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Patient created and the account invitation was queued.',
        ]);

        return back();
    }

    public function show(Request $request, Patient $patient): Response
    {
        Gate::authorize('view', $patient);

        $requestedPerPage = $request->integer('per_page', 5);
        $perPage = in_array($requestedPerPage, [5, 10, 25], true) ? $requestedPerPage : 5;
        $dateFrom = $this->validDateFilter($request->string('date_from')->toString());
        $dateTo = $this->validDateFilter($request->string('date_to')->toString());

        return Inertia::render('patients/show', [
            'patient' => $this->serializePatient($patient),
            'medicalRecord' => $this->patientClinicalRecordService->medicalSummary($patient),
            'latestVisit' => $this->patientClinicalRecordService->latestVisit($patient),
            'visits' => $this->patientClinicalRecordService->visits($patient, $perPage, $dateFrom, $dateTo),
            'posTransactions' => $this->patientClinicalRecordService->posTransactions($patient),
            'filters' => ['per_page' => $perPage, 'date_from' => $dateFrom, 'date_to' => $dateTo],
            'clinicalOptions' => $this->patientClinicalRecordService->options(),
        ]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient): RedirectResponse
    {
        $emailChanged = $patient->email !== $request->validated('email');

        $this->patientManagementService->update($patient, $request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $emailChanged
                ? 'Patient updated and a new verification link was queued.'
                : 'Patient updated successfully.',
        ]);

        return back();
    }

    public function destroy(Patient $patient): RedirectResponse
    {
        Gate::authorize('delete', $patient);

        $this->patientManagementService->delete($patient);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Patient deleted successfully.',
        ]);

        return back();
    }

    /** @return array{search: string, verification: string|null, per_page: int} */
    private function filters(Request $request): array
    {
        $verification = $request->string('verification')->toString();
        $requestedPerPage = $request->integer('per_page', 10);

        return [
            'search' => $request->string('search')->squish()->toString(),
            'verification' => in_array($verification, ['verified', 'unverified'], true) ? $verification : null,
            'per_page' => in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10,
        ];
    }

    /** @return array<string, int|string|null> */
    private function serializePatient(Patient $patient): array
    {
        return [
            ...app(\App\Services\NewRecordService::class)->metadata($patient),
            'PID' => $patient->PID,
            'first_name' => $patient->first_name,
            'middle_name' => $patient->middle_name,
            'last_name' => $patient->last_name,
            'full_name' => $patient->full_name,
            'email' => $patient->email,
            'email_verified_at' => $patient->email_verified_at?->toISOString(),
            'contact_number' => $patient->contact_number,
            'address' => $patient->address,
            'sex' => $patient->sex,
            'date_of_birth' => $patient->date_of_birth->toDateString(),
            'age' => $patient->age,
            'civil_status' => $patient->civil_status,
            'created_at' => $patient->created_at?->toISOString(),
            'last_visit_at' => isset($patient->last_visit_at)
                ? $patient->last_visit_at->toISOString()
                : null,
        ];
    }

    private function validDateFilter(string $value): ?string
    {
        if (! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $matches)) {
            return null;
        }

        return checkdate((int) $matches[2], (int) $matches[3], (int) $matches[1]) ? $value : null;
    }
}
