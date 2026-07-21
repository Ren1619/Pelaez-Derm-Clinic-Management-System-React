<?php

use App\Models\Branch;
use App\Models\Patient;
use App\Models\PatientAllergy;
use App\Models\PatientMedicalCondition;
use App\Models\PatientMedication;
use App\Models\PatientVisit;
use App\Models\PatientVisitDiagnosis;
use App\Models\PatientVisitPrescription;
use App\Models\PatientVisitProduct;
use App\Models\PatientVisitService;
use App\Models\Product;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from a patient clinical record', function () {
    $patient = Patient::factory()->create();

    $this->get(route('patients.show', $patient))
        ->assertRedirect(route('login'));
});

test('authenticated users can view a complete patient clinical record', function () {
    $user = User::factory()->create();
    $branch = Branch::factory()->create(['branch_name' => 'Valencia City']);
    $doctor = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'first_name' => 'Rosa',
        'middle_name' => null,
        'last_name' => 'Pelaez',
    ]);
    $patient = Patient::factory()->create([
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
    ]);

    PatientAllergy::factory()->create([
        'PID' => $patient->PID,
        'allergy' => 'Penicillin',
    ]);
    PatientMedicalCondition::factory()->create([
        'PID' => $patient->PID,
        'condition' => 'Acne Vulgaris',
    ]);
    PatientMedication::factory()->create([
        'PID' => $patient->PID,
        'medication' => 'Doxycycline',
    ]);

    $visit = PatientVisit::factory()->create([
        'PID' => $patient->PID,
        'branch_ID' => $branch->branch_ID,
        'doctor_account_ID' => $doctor->account_ID,
        'branch_name' => 'Valencia City',
        'doctor_name' => 'Dr. Rosa Pelaez',
        'visited_at' => '2026-02-10 09:00:00',
    ]);
    PatientVisitService::factory()->create([
        'visit_ID' => $visit->visit_ID,
        'service_name' => 'Initial Dermatology Consultation',
    ]);
    PatientVisitProduct::factory()->create([
        'visit_ID' => $visit->visit_ID,
        'product_name' => 'CeraVe Moisturizing Cream',
        'quantity' => 2,
        'unit_price' => 450,
    ]);
    PatientVisitDiagnosis::factory()->create([
        'visit_ID' => $visit->visit_ID,
        'diagnosis' => 'Acne Vulgaris (Moderate)',
    ]);
    PatientVisitPrescription::factory()->create([
        'visit_ID' => $visit->visit_ID,
        'prescription' => 'Tretinoin 0.025% Cream',
        'dosage' => 'Pea-sized amount',
    ]);

    $this->actingAs($user)
        ->get(route('patients.show', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patients/show')
            ->where('patient.full_name', 'Juan Dela Cruz')
            ->where('medicalRecord.allergies.0.allergy', 'Penicillin')
            ->where('medicalRecord.medical_conditions.0.condition', 'Acne Vulgaris')
            ->where('medicalRecord.medications.0.medication', 'Doxycycline')
            ->where('latestVisit.branch.branch_name', 'Valencia City')
            ->where('latestVisit.doctor.name', 'Rosa Pelaez')
            ->where('latestVisit.services.0.service_name', 'Initial Dermatology Consultation')
            ->where('latestVisit.products.0.product_name', 'CeraVe Moisturizing Cream')
            ->where('latestVisit.products.0.quantity', 2)
            ->where('latestVisit.diagnoses.0.diagnosis', 'Acne Vulgaris (Moderate)')
            ->where('latestVisit.prescriptions.0.prescription', 'Tretinoin 0.025% Cream')
            ->has('visits.data', 1));
});

test('patient listing exposes the most recent clinic visit', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create(['email' => 'visits@example.com']);

    PatientVisit::factory()->create([
        'PID' => $patient->PID,
        'visited_at' => '2025-01-10 09:00:00',
    ]);
    PatientVisit::factory()->create([
        'PID' => $patient->PID,
        'visited_at' => '2026-03-15 14:30:00',
    ]);

    $this->actingAs($user)
        ->get(route('patients.index', ['search' => 'visits@example.com']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('patients.data.0.last_visit_at', fn (string $value): bool => str_starts_with($value, '2026-03-15')));
});

test('visit history is ordered newest first and paginated', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    foreach (range(1, 6) as $day) {
        PatientVisit::factory()->create([
            'PID' => $patient->PID,
            'visited_at' => "2026-01-0{$day} 09:00:00",
        ]);
    }

    $this->actingAs($user)
        ->get(route('patients.show', $patient))
        ->assertInertia(fn (Assert $page) => $page
            ->where('visits.total', 6)
            ->has('visits.data', 5)
            ->where('visits.data.0.visited_at', fn (string $value): bool => str_starts_with($value, '2026-01-06')));
});

test('clinical snapshots remain readable after linked catalog records are deleted', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID]);
    $service = Service::factory()->create(['name' => 'Legacy Facial']);
    $product = Product::factory()->create(['name' => 'Legacy Cream']);

    $visitService = PatientVisitService::factory()->create([
        'visit_ID' => $visit->visit_ID,
        'service_ID' => $service->service_ID,
        'service_name' => 'Legacy Facial',
    ]);
    $visitProduct = PatientVisitProduct::factory()->create([
        'visit_ID' => $visit->visit_ID,
        'product_ID' => $product->product_ID,
        'product_name' => 'Legacy Cream',
    ]);

    $service->delete();
    $product->delete();

    expect($visitService->refresh())
        ->service_ID->toBeNull()
        ->service_name->toBe('Legacy Facial')
        ->and($visitProduct->refresh())
        ->product_ID->toBeNull()
        ->product_name->toBe('Legacy Cream');

    $this->actingAs($user)
        ->get(route('patients.show', $patient))
        ->assertInertia(fn (Assert $page) => $page
            ->where('latestVisit.services.0.service_name', 'Legacy Facial')
            ->where('latestVisit.products.0.product_name', 'Legacy Cream'));
});

test('deleting a patient cascades through their complete clinical record', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();
    $allergy = PatientAllergy::factory()->create(['PID' => $patient->PID]);
    $condition = PatientMedicalCondition::factory()->create(['PID' => $patient->PID]);
    $medication = PatientMedication::factory()->create(['PID' => $patient->PID]);
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID]);
    $diagnosis = PatientVisitDiagnosis::factory()->create(['visit_ID' => $visit->visit_ID]);

    $this->actingAs($user)->delete(route('patients.destroy', $patient));

    $this->assertModelMissing($allergy);
    $this->assertModelMissing($condition);
    $this->assertModelMissing($medication);
    $this->assertModelMissing($visit);
    $this->assertModelMissing($diagnosis);
});

test('visit history can be filtered by an inclusive date range', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    PatientVisit::factory()->create(['PID' => $patient->PID, 'visited_at' => '2026-01-31 09:00:00']);
    PatientVisit::factory()->create(['PID' => $patient->PID, 'visited_at' => '2026-02-10 09:00:00']);
    PatientVisit::factory()->create(['PID' => $patient->PID, 'visited_at' => '2026-02-28 17:00:00']);
    PatientVisit::factory()->create(['PID' => $patient->PID, 'visited_at' => '2026-03-01 09:00:00']);

    $this->actingAs($user)
        ->get(route('patients.show', [
            'patient' => $patient,
            'date_from' => '2026-02-01',
            'date_to' => '2026-02-28',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.date_from', '2026-02-01')
            ->where('filters.date_to', '2026-02-28')
            ->where('visits.total', 2)
            ->where('visits.data.0.visited_at', fn (string $value): bool => str_starts_with($value, '2026-02-28')));
});

test('staff can manage patient summary records from the EHR', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    $this->actingAs($user)
        ->post(route('patients.medical-conditions.store', $patient), [
            'condition' => 'Psoriasis',
            'note' => 'Scalp and elbows',
        ])
        ->assertRedirect();

    $condition = PatientMedicalCondition::query()->whereBelongsTo($patient, 'patient')->firstOrFail();

    $this->actingAs($user)
        ->patch(route('patients.medical-conditions.update', [$patient, $condition]), [
            'condition' => 'Plaque Psoriasis',
            'note' => 'Improving',
        ])
        ->assertRedirect();

    expect($condition->refresh())
        ->condition->toBe('Plaque Psoriasis')
        ->note->toBe('Improving');

    $this->actingAs($user)
        ->delete(route('patients.medical-conditions.destroy', [$patient, $condition]))
        ->assertRedirect();

    $this->assertModelMissing($condition);
});

test('staff can create a visit with clinic and doctor snapshots', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();
    $branch = Branch::factory()->create(['branch_name' => 'Malaybalay Clinic']);
    $doctor = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'first_name' => 'Amelia',
        'middle_name' => null,
        'last_name' => 'Reyes',
    ]);

    $this->actingAs($user)
        ->post(route('patients.visits.store', $patient), [
            'branch_ID' => $branch->branch_ID,
            'doctor_account_ID' => $doctor->account_ID,
            'visited_at' => '2026-06-18T09:30',
            'blood_pressure' => '131/88',
            'weight' => 54,
            'height' => 171,
            'status' => 'completed',
        ])
        ->assertRedirect();

    $visit = PatientVisit::query()->whereBelongsTo($patient, 'patient')->firstOrFail();

    expect($visit)
        ->branch_name->toBe('Malaybalay Clinic')
        ->doctor_name->toBe('Amelia Reyes')
        ->blood_pressure->toBe('131/88')
        ->finalized_at->not->toBeNull();
});

test('staff can manage every visit record tab', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID]);
    $service = Service::factory()->create(['name' => 'Acne Facial']);

    $this->actingAs($user)
        ->post(route('patients.visits.diagnoses.store', [$patient, $visit]), [
            'diagnosis' => 'Inflammatory Acne',
            'note' => 'Moderate',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('patients.visits.prescriptions.store', [$patient, $visit]), [
            'prescription' => 'Doxycycline',
            'dosage' => '100 mg',
            'frequency' => 'Once daily',
            'duration' => '30 days',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('patients.visits.services.store', [$patient, $visit]), [
            'service_ID' => $service->service_ID,
            'quantity' => 1,
            'note' => 'Completed',
        ])
        ->assertRedirect();

    expect($visit->diagnoses()->value('diagnosis'))->toBe('Inflammatory Acne')
        ->and($visit->prescriptions()->value('prescription'))->toBe('Doxycycline')
        ->and($visit->services()->value('service_name'))->toBe('Acne Facial');
});

test('visit product changes keep inventory quantities consistent', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID]);
    $product = Product::factory()->create([
        'name' => 'Gentle Cleanser',
        'quantity' => 10,
        'price' => 350,
    ]);

    $this->actingAs($user)
        ->post(route('patients.visits.products.store', [$patient, $visit]), [
            'product_ID' => $product->product_ID,
            'quantity' => 3,
            'note' => 'Take home',
        ])
        ->assertRedirect();

    $visitProduct = $visit->products()->firstOrFail();
    expect($product->refresh()->quantity)->toBe(7)
        ->and($visitProduct->product_name)->toBe('Gentle Cleanser')
        ->and($visitProduct->unit_price)->toBe('350.00');

    $this->actingAs($user)
        ->patch(route('patients.visits.products.update', [$patient, $visit, $visitProduct]), [
            'product_ID' => $product->product_ID,
            'quantity' => 5,
            'note' => 'Updated quantity',
        ])
        ->assertRedirect();

    expect($product->refresh()->quantity)->toBe(5);

    $this->actingAs($user)
        ->delete(route('patients.visits.products.destroy', [$patient, $visit, $visitProduct]))
        ->assertRedirect();

    expect($product->refresh()->quantity)->toBe(10);
    $this->assertModelMissing($visitProduct);
});

test('nested clinical records cannot be changed through another patient', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();
    $otherPatient = Patient::factory()->create();
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID]);
    $diagnosis = PatientVisitDiagnosis::factory()->create(['visit_ID' => $visit->visit_ID]);

    $this->actingAs($user)
        ->delete(route('patients.visits.diagnoses.destroy', [$otherPatient, $visit, $diagnosis]))
        ->assertNotFound();

    $this->assertModelExists($diagnosis);
});
