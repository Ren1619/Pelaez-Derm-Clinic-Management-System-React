<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Patient;
use App\Models\PatientMedicalCondition;
use App\Models\PatientVisit;
use App\Models\PatientVisitDiagnosis;
use App\Models\PatientVisitPrescription;
use App\Models\PatientVisitProduct;
use App\Models\PatientVisitService;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\SystemNotification;
use Inertia\Testing\AssertableInertia as Assert;

test('patient portal modules require a patient session', function (string $routeName) {
    $this->get(route($routeName))->assertRedirect(route('login'));
})->with([
    'health record' => 'patient.health-record.index',
    'appointments' => 'patient.appointments.index',
    'services' => 'patient.services.index',
    'feedback' => 'patient.feedback.index',
]);

test('patients see only their own complete health record', function () {
    $patient = Patient::factory()->create(['first_name' => 'Maria', 'middle_name' => null, 'last_name' => 'Santos']);
    $otherPatient = Patient::factory()->create();
    PatientMedicalCondition::factory()->create(['PID' => $patient->PID, 'condition' => 'Own condition']);
    PatientMedicalCondition::factory()->create(['PID' => $otherPatient->PID, 'condition' => 'Private other condition']);
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID, 'branch_name' => 'Valencia City']);
    $otherVisit = PatientVisit::factory()->create(['PID' => $otherPatient->PID]);
    PatientVisitDiagnosis::factory()->create(['visit_ID' => $visit->visit_ID, 'diagnosis' => 'Own diagnosis']);
    PatientVisitPrescription::factory()->create(['visit_ID' => $visit->visit_ID, 'prescription' => 'Own prescription']);
    PatientVisitService::factory()->create(['visit_ID' => $visit->visit_ID, 'service_name' => 'Own service']);
    PatientVisitProduct::factory()->create(['visit_ID' => $visit->visit_ID, 'product_name' => 'Own product']);
    PatientVisitDiagnosis::factory()->create(['visit_ID' => $otherVisit->visit_ID, 'diagnosis' => 'Private diagnosis']);

    $this->actingAs($patient, 'patient')
        ->get(route('patient.health-record.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patient/health-record/index')
            ->where('patient.PID', $patient->PID)
            ->where('patient.name', 'Maria Santos')
            ->where('medicalRecord.medical_conditions.0.condition', 'Own condition')
            ->where('visits.total', 1)
            ->where('visits.data.0.visit_ID', $visit->visit_ID)
            ->where('visits.data.0.diagnoses.0.diagnosis', 'Own diagnosis')
            ->where('visits.data.0.prescriptions.0.prescription', 'Own prescription')
            ->where('visits.data.0.services.0.service_name', 'Own service')
            ->where('visits.data.0.products.0.product_name', 'Own product'));
});

test('patients can manage only their own health summary entries', function () {
    $patient = Patient::factory()->create();
    $otherPatient = Patient::factory()->create();
    $otherCondition = PatientMedicalCondition::factory()->create(['PID' => $otherPatient->PID]);

    $this->actingAs($patient, 'patient')
        ->post(route('patient.health-record.medical-conditions.store'), [
            'condition' => 'Atopic dermatitis',
            'note' => 'Seasonal flare-ups',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $condition = PatientMedicalCondition::query()->where('PID', $patient->PID)->firstOrFail();

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.health-record.medical-conditions.update', $condition), [
            'condition' => 'Controlled atopic dermatitis',
            'note' => 'Improving',
        ])
        ->assertRedirect();

    expect($condition->refresh()->condition)->toBe('Controlled atopic dermatitis');

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.health-record.medical-conditions.update', $otherCondition), [
            'condition' => 'Attempted change',
        ])
        ->assertNotFound();

    $this->actingAs($patient, 'patient')
        ->delete(route('patient.health-record.medical-conditions.destroy', $condition))
        ->assertRedirect();

    $this->assertModelMissing($condition);
    $this->assertModelExists($otherCondition);
});

test('patients only see their own appointment history', function () {
    $patient = Patient::factory()->create();
    $otherPatient = Patient::factory()->create();
    $ownAppointment = Appointment::factory()->create(['PID' => $patient->PID, 'status' => 'upcoming']);
    Appointment::factory()->create(['PID' => $otherPatient->PID, 'status' => 'upcoming']);
    $category = Category::factory()->service()->create(['category_name' => 'Facial Treatments']);
    $service = Service::factory()->create([
        'category_ID' => $category->category_ID,
        'name' => 'Hydra Facial',
    ]);

    $this->actingAs($patient, 'patient')
        ->get(route('patient.appointments.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patient/appointments/index')
            ->where('patient.PID', $patient->PID)
            ->where('appointments.total', 1)
            ->where('appointments.data.0.appointment_ID', $ownAppointment->appointment_ID)
            ->where('services.0.service_ID', $service->service_ID)
            ->where('services.0.name', 'Hydra Facial')
            ->where('services.0.category_name', 'Facial Treatments'));
});

test('patients can request service appointments only for themselves', function () {
    $patient = Patient::factory()->create();
    $branch = Branch::factory()->create(['branch_name' => 'Malaybalay City']);
    $service = Service::factory()->create(['name' => 'Acne Treatment']);
    $date = now()->next('Monday')->toDateString();

    $this->actingAs($patient, 'patient')
        ->post(route('patient.appointments.store'), [
            'branch_ID' => $branch->branch_ID,
            'scheduled_date' => $date,
            'scheduled_time' => '09:00',
            'appointment_type' => 'service',
            'service_ids' => [$service->service_ID],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $appointment = Appointment::query()->firstOrFail();
    expect($appointment)
        ->PID->toBe($patient->PID)
        ->branch_ID->toBe($branch->branch_ID)
        ->status->toBe('pending')
        ->created_by->toBeNull()
        ->and($appointment->services()->firstOrFail()->service_name)->toBe('Acne Treatment');
});

test('patients cannot reschedule or cancel another patients appointment', function () {
    $patient = Patient::factory()->create();
    $otherAppointment = Appointment::factory()->create();
    $branch = Branch::factory()->create();
    $date = now()->next('Monday')->toDateString();

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.appointments.update', $otherAppointment), [
            'branch_ID' => $branch->branch_ID,
            'scheduled_date' => $date,
            'scheduled_time' => '10:00',
            'appointment_type' => 'consultation',
            'concern' => 'Unauthorized change',
        ])
        ->assertForbidden();

    $this->actingAs($patient, 'patient')
        ->post(route('patient.appointments.cancel', $otherAppointment), ['reason' => 'Unauthorized'])
        ->assertForbidden();

    $this->actingAs($patient, 'patient')
        ->getJson(route('patient.appointments.availability', [
            'branch_ID' => $branch->branch_ID,
            'date' => $date,
            'exclude_appointment_ID' => $otherAppointment->appointment_ID,
        ]))
        ->assertForbidden();

    expect($otherAppointment->refresh()->status)->toBe('pending');
});

test('patients can accept a clinic proposal or submit another schedule before staff approval', function () {
    $patient = Patient::factory()->create();
    $branch = Branch::factory()->create();
    $staff = StaffAccount::factory()->admin()->create([
        'branch_ID' => $branch->branch_ID,
    ]);
    $date = now()->next('Monday')->toDateString();
    $appointment = Appointment::factory()->create([
        'PID' => $patient->PID,
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'scheduled_at' => "{$date} 09:00:00",
        'status' => 'pending',
    ]);

    $this->actingAs($staff)
        ->patch(route('appointments.update', $appointment), [
            'scheduled_date' => $date,
            'scheduled_time' => '10:00',
            'reschedule_reason' => 'The clinic schedule changed.',
        ])
        ->assertSessionHasNoErrors();

    expect($appointment->refresh())
        ->status->toBe('reschedule_requested')
        ->reschedule_reason->toBe('The clinic schedule changed.')
        ->and(SystemNotification::query()->where('type', 'appointment_reschedule_requested')->count())
        ->toBe(1);

    $this->actingAs($patient, 'patient')
        ->get(route('patient.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.status', 'reschedule_requested')
            ->where('appointments.data.0.can_accept_reschedule', true)
            ->where('appointments.data.0.reschedule_reason', 'The clinic schedule changed.'));

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.appointments.accept-reschedule', $appointment))
        ->assertSessionHasNoErrors();

    expect($appointment->refresh())
        ->status->toBe('pending')
        ->reschedule_responded_at->not->toBeNull();

    $this->actingAs($staff)
        ->patch(route('appointments.status', $appointment), ['action' => 'approve'])
        ->assertSessionHasNoErrors();

    expect($appointment->refresh()->status)->toBe('upcoming');

    $this->actingAs($staff)
        ->patch(route('appointments.update', $appointment), [
            'scheduled_date' => $date,
            'scheduled_time' => '11:00',
            'reschedule_reason' => 'A second clinic conflict occurred.',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.appointments.update', $appointment), [
            'branch_ID' => $branch->branch_ID,
            'scheduled_date' => $date,
            'scheduled_time' => '12:00',
            'appointment_type' => 'consultation',
            'concern' => $appointment->concern,
            'reschedule_reason' => 'Noon works better for me.',
        ])
        ->assertSessionHasNoErrors();

    expect($appointment->refresh())
        ->status->toBe('pending')
        ->scheduled_at->format('H:i')->toBe('12:00')
        ->reschedule_responded_at->not->toBeNull();
});

test('the patient service catalog shows clinic services and supports booking links', function () {
    $patient = Patient::factory()->create();
    $serviceCategory = Category::factory()->service()->create(['category_name' => 'Facial Treatments']);
    $productCategory = Category::factory()->product()->create(['category_name' => 'Moisturizers']);
    $service = Service::factory()->create(['category_ID' => $serviceCategory->category_ID, 'name' => 'Hydra Facial']);
    Service::factory()->create(['category_ID' => $productCategory->category_ID, 'name' => 'Not a clinic service']);

    $this->actingAs($patient, 'patient')
        ->get(route('patient.services.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patient/services/index')
            ->where('patient.PID', $patient->PID)
            ->has('services', 1)
            ->where('services.0.id', $service->service_ID)
            ->where('services.0.name', 'Hydra Facial')
            ->has('categories', 1));
});
