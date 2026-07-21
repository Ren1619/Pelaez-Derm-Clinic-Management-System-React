<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientVisitRequest;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\StaffAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientVisitController extends Controller
{
    public function store(SavePatientVisitRequest $request, Patient $patient): RedirectResponse
    {
        Gate::authorize('update', $patient);

        $patient->visits()->create($this->visitData($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit added successfully.']);

        return back();
    }

    public function update(SavePatientVisitRequest $request, Patient $patient, PatientVisit $visit): RedirectResponse
    {
        Gate::authorize('update', $patient);

        $visit->update($this->visitData($request, $visit));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientVisit $visit): RedirectResponse
    {
        Gate::authorize('update', $patient);

        $visit->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit deleted successfully.']);

        return back();
    }

    /** @return array<string, mixed> */
    private function visitData(SavePatientVisitRequest $request, ?PatientVisit $visit = null): array
    {
        $validated = $request->validated();
        $branch = Branch::query()->findOrFail($request->integer('branch_ID'));
        $doctor = $request->filled('doctor_account_ID')
            ? StaffAccount::query()->findOrFail($request->integer('doctor_account_ID'))
            : null;
        $status = $request->string('status')->toString();

        return [
            ...$validated,
            'branch_name' => $branch->branch_name,
            'doctor_name' => $doctor?->full_name,
            'finalized_at' => $status === 'completed'
                ? ($visit === null ? now() : ($visit->finalized_at ?? now()))
                : null,
        ];
    }
}
