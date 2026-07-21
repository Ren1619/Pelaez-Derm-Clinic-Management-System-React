<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientMedicationRequest;
use App\Models\Patient;
use App\Models\PatientMedication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientMedicationController extends Controller
{
    public function store(SavePatientMedicationRequest $request, Patient $patient): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $patient->medications()->create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Medication added successfully.']);

        return back();
    }

    public function update(SavePatientMedicationRequest $request, Patient $patient, PatientMedication $medication): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $medication->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Medication updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientMedication $medication): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $medication->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Medication deleted successfully.']);

        return back();
    }
}
