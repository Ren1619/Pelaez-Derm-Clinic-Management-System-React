<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientVisitDiagnosisRequest;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientVisitDiagnosis;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientVisitDiagnosisController extends Controller
{
    public function store(SavePatientVisitDiagnosisRequest $request, Patient $patient, PatientVisit $visit): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $visit->diagnoses()->create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Diagnosis added successfully.']);

        return back();
    }

    public function update(SavePatientVisitDiagnosisRequest $request, Patient $patient, PatientVisit $visit, PatientVisitDiagnosis $diagnosis): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $diagnosis->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Diagnosis updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientVisit $visit, PatientVisitDiagnosis $diagnosis): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $diagnosis->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Diagnosis deleted successfully.']);

        return back();
    }
}
