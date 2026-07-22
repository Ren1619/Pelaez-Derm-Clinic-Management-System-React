<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientAllergyRequest;
use App\Http\Requests\SavePatientMedicalConditionRequest;
use App\Http\Requests\SavePatientMedicationRequest;
use App\Models\Patient;
use App\Models\PatientAllergy;
use App\Models\PatientMedicalCondition;
use App\Models\PatientMedication;
use App\Services\PatientClinicalRecordService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientHealthRecordController extends Controller
{
    public function __construct(private PatientClinicalRecordService $clinicalRecordService) {}

    public function index(Request $request): Response
    {
        $patient = $this->patient($request);
        $perPage = in_array($request->integer('per_page', 5), [5, 10, 25], true)
            ? $request->integer('per_page', 5)
            : 5;
        $dateFrom = $this->validDate($request->string('date_from')->toString());
        $dateTo = $this->validDate($request->string('date_to')->toString());

        return Inertia::render('patient/health-record/index', [
            'patient' => $this->serializePatient($patient),
            'medicalRecord' => $this->clinicalRecordService->medicalSummary($patient),
            'latestVisit' => $this->clinicalRecordService->latestVisit($patient),
            'visits' => $this->clinicalRecordService->visits($patient, $perPage, $dateFrom, $dateTo),
            'posTransactions' => $this->clinicalRecordService->posTransactions($patient),
            'filters' => ['per_page' => $perPage, 'date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function storeMedicalCondition(SavePatientMedicalConditionRequest $request): RedirectResponse
    {
        $this->patient($request)->medicalConditions()->create($request->validated());

        return $this->saved('Medical condition added successfully.');
    }

    public function updateMedicalCondition(SavePatientMedicalConditionRequest $request, PatientMedicalCondition $medicalCondition): RedirectResponse
    {
        $this->ensureOwned($request, $medicalCondition->PID);
        $medicalCondition->update($request->validated());

        return $this->saved('Medical condition updated successfully.');
    }

    public function destroyMedicalCondition(Request $request, PatientMedicalCondition $medicalCondition): RedirectResponse
    {
        $this->ensureOwned($request, $medicalCondition->PID);
        $medicalCondition->delete();

        return $this->saved('Medical condition deleted successfully.');
    }

    public function storeAllergy(SavePatientAllergyRequest $request): RedirectResponse
    {
        $this->patient($request)->allergies()->create($request->validated());

        return $this->saved('Allergy added successfully.');
    }

    public function updateAllergy(SavePatientAllergyRequest $request, PatientAllergy $allergy): RedirectResponse
    {
        $this->ensureOwned($request, $allergy->PID);
        $allergy->update($request->validated());

        return $this->saved('Allergy updated successfully.');
    }

    public function destroyAllergy(Request $request, PatientAllergy $allergy): RedirectResponse
    {
        $this->ensureOwned($request, $allergy->PID);
        $allergy->delete();

        return $this->saved('Allergy deleted successfully.');
    }

    public function storeMedication(SavePatientMedicationRequest $request): RedirectResponse
    {
        $this->patient($request)->medications()->create($request->validated());

        return $this->saved('Medication added successfully.');
    }

    public function updateMedication(SavePatientMedicationRequest $request, PatientMedication $medication): RedirectResponse
    {
        $this->ensureOwned($request, $medication->PID);
        $medication->update($request->validated());

        return $this->saved('Medication updated successfully.');
    }

    public function destroyMedication(Request $request, PatientMedication $medication): RedirectResponse
    {
        $this->ensureOwned($request, $medication->PID);
        $medication->delete();

        return $this->saved('Medication deleted successfully.');
    }

    private function patient(Request $request): Patient
    {
        $patient = $request->user('patient');

        abort_unless($patient instanceof Patient, 401);

        return $patient;
    }

    private function ensureOwned(Request $request, int $patientId): void
    {
        abort_unless($this->patient($request)->PID === $patientId, 404);
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    /** @return array<string, int|string|null> */
    private function serializePatient(Patient $patient): array
    {
        return [
            'PID' => $patient->PID,
            'first_name' => $patient->first_name,
            'middle_name' => $patient->middle_name,
            'last_name' => $patient->last_name,
            'full_name' => $patient->full_name,
            'name' => $patient->full_name,
            'email' => $patient->email,
            'email_verified_at' => $patient->email_verified_at?->toISOString(),
            'contact_number' => $patient->contact_number,
            'address' => $patient->address,
            'sex' => $patient->sex,
            'date_of_birth' => $patient->date_of_birth->toDateString(),
            'age' => $patient->age,
            'civil_status' => $patient->civil_status,
            'created_at' => $patient->created_at?->toISOString(),
            'last_visit_at' => $patient->latestVisit()->first()?->visited_at?->toISOString(),
        ];
    }

    private function validDate(string $value): ?string
    {
        if (! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $matches)) {
            return null;
        }

        return checkdate((int) $matches[2], (int) $matches[3], (int) $matches[1]) ? $value : null;
    }
}
