<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientVisitPrescriptionRequest;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientVisitPrescription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientVisitPrescriptionController extends Controller
{
    public function store(SavePatientVisitPrescriptionRequest $request, Patient $patient, PatientVisit $visit): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $visit->prescriptions()->create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Prescription added successfully.']);

        return back();
    }

    public function update(SavePatientVisitPrescriptionRequest $request, Patient $patient, PatientVisit $visit, PatientVisitPrescription $prescription): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $prescription->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Prescription updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientVisit $visit, PatientVisitPrescription $prescription): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $prescription->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Prescription deleted successfully.']);

        return back();
    }
}
