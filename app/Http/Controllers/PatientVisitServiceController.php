<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientVisitServiceRequest;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientVisitService;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PatientVisitServiceController extends Controller
{
    public function store(SavePatientVisitServiceRequest $request, Patient $patient, PatientVisit $visit): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $visit->services()->create($this->serviceData($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit service added successfully.']);

        return back();
    }

    public function update(SavePatientVisitServiceRequest $request, Patient $patient, PatientVisit $visit, PatientVisitService $service): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $service->update($this->serviceData($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit service updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientVisit $visit, PatientVisitService $service): RedirectResponse
    {
        Gate::authorize('update', $patient);
        $service->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit service deleted successfully.']);

        return back();
    }

    /** @return array<string, mixed> */
    private function serviceData(SavePatientVisitServiceRequest $request): array
    {
        $validated = $request->validated();
        $catalogService = Service::query()->findOrFail($request->integer('service_ID'));

        return [...$validated, 'service_name' => $catalogService->name];
    }
}
