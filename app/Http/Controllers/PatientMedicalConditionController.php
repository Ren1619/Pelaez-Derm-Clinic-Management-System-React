<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientMedicalConditionRequest;
use App\Models\Patient;
use App\Models\PatientMedicalCondition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientMedicalConditionController extends Controller
{
    public function store(SavePatientMedicalConditionRequest $request, Patient $patient): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $patient->medicalConditions()->create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Medical condition added successfully.']);

        return back();
    }

    public function update(SavePatientMedicalConditionRequest $request, Patient $patient, PatientMedicalCondition $medicalCondition): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $medicalCondition->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Medical condition updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientMedicalCondition $medicalCondition): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $medicalCondition->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Medical condition deleted successfully.']);

        return back();
    }
}
