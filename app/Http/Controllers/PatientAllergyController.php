<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientAllergyRequest;
use App\Models\Patient;
use App\Models\PatientAllergy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientAllergyController extends Controller
{
    public function store(SavePatientAllergyRequest $request, Patient $patient): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $patient->allergies()->create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Allergy added successfully.']);

        return back();
    }

    public function update(SavePatientAllergyRequest $request, Patient $patient, PatientAllergy $allergy): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $allergy->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Allergy updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientAllergy $allergy): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $allergy->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Allergy deleted successfully.']);

        return back();
    }
}
