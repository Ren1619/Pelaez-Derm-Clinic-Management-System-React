<?php

use App\Models\AccountRole;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Service;
use App\Models\StaffAccount;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-07-20 08:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

test('guests cannot access appointment management', function () {
    $this->get(route('appointments.index'))->assertRedirect(route('login'));
});

test('authenticated staff can view the original appointment statuses and calendar data', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $appointment = Appointment::factory()->create([
        'scheduled_at' => '2026-07-20 09:00:00',
        'status' => 'today',
    ]);

    $this->actingAs($user)->get(route('appointments.index', ['month' => '2026-07']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/index')
            ->where('appointments.data.0.appointment_ID', $appointment->appointment_ID)
            ->where('summary.today', 1)
            ->has('summary.pending')
            ->has('summary.upcoming')
            ->has('summary.completed')
            ->has('summary.cancelled')
            ->has('summary.incomplete')
            ->has('calendarAppointments', 1)
            ->has('timeSlots', 9));
});

test('staff can schedule a service appointment with consolidated service records', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create(['branch_name' => 'Valencia Clinic']);
    $patient = Patient::factory()->create();
    $services = Service::factory()->count(2)->create();

    $this->actingAs($user)->post(route('appointments.store'), [
        'branch_ID' => $branch->branch_ID,
        'PID' => $patient->PID,
        'scheduled_date' => '2026-07-21',
        'scheduled_time' => '09:00',
        'appointment_type' => 'service',
        'service_ids' => $services->modelKeys(),
    ])->assertRedirect();

    $appointment = Appointment::query()->firstOrFail();
    expect($appointment)
        ->branch_name->toBe('Valencia Clinic')
        ->status->toBe('pending')
        ->appointment_type->toBe('service')
        ->created_by->toBe($user->account_ID)
        ->and($appointment->services)->toHaveCount(2);
});

test('sundays and a third booking in the same clinic slot are rejected', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $patients = Patient::factory()->count(3)->create();

    $payload = [
        'branch_ID' => $branch->branch_ID,
        'scheduled_date' => '2026-07-21',
        'scheduled_time' => '10:00',
        'appointment_type' => 'consultation',
        'concern' => 'Recurring rash',
    ];

    foreach ($patients->take(2) as $patient) {
        $this->actingAs($user)->post(route('appointments.store'), [...$payload, 'PID' => $patient->PID])->assertSessionHasNoErrors();
    }

    $this->actingAs($user)->post(route('appointments.store'), [...$payload, 'PID' => $patients[2]->PID])
        ->assertSessionHasErrors('scheduled_time');

    $this->actingAs($user)->post(route('appointments.store'), [
        ...$payload,
        'PID' => $patients[2]->PID,
        'scheduled_date' => '2026-07-26',
    ])->assertSessionHasErrors('scheduled_date');
});

test('approving an appointment assigns the correct lifecycle status', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $today = Appointment::factory()->create(['scheduled_at' => '2026-07-20 11:00:00', 'status' => 'pending']);
    $future = Appointment::factory()->create(['scheduled_at' => '2026-07-21 11:00:00', 'status' => 'pending']);

    $this->actingAs($user)->patch(route('appointments.status', $today), ['action' => 'approve'])->assertRedirect();
    $this->actingAs($user)->patch(route('appointments.status', $future), ['action' => 'approve'])->assertRedirect();

    expect($today->refresh()->status)->toBe('today')
        ->and($future->refresh()->status)->toBe('upcoming');
});

test('starting an appointment creates exactly one connected patient visit and copies services', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create(['branch_name' => 'Malaybalay Clinic']);
    $doctorRole = AccountRole::factory()->doctor()->create();
    $doctor = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $doctorRole->role_ID,
        'first_name' => 'Amelia',
        'middle_name' => null,
        'last_name' => 'Reyes',
    ]);
    $patient = Patient::factory()->create();
    $service = Service::factory()->create(['name' => 'Acne Facial']);
    $appointment = Appointment::factory()->service()->create([
        'branch_ID' => $branch->branch_ID,
        'PID' => $patient->PID,
        'branch_name' => $branch->branch_name,
        'scheduled_at' => '2026-07-20 09:00:00',
        'status' => 'today',
    ]);
    $appointment->services()->create(['service_ID' => $service->service_ID, 'service_name' => $service->name]);

    $this->actingAs($user)->post(route('appointments.start-visit', $appointment), [
        'doctor_account_ID' => $doctor->account_ID,
    ])->assertRedirect(route('patients.show', ['patient' => $patient->PID, 'visit' => 1]));

    $visit = PatientVisit::query()->firstOrFail();
    expect($appointment->refresh())
        ->visit_ID->toBe($visit->visit_ID)
        ->doctor_account_ID->toBe($doctor->account_ID)
        ->and($visit)
        ->PID->toBe($patient->PID)
        ->branch_name->toBe('Malaybalay Clinic')
        ->doctor_name->toBe('Amelia Reyes')
        ->and($visit->services()->firstOrFail()->service_name)->toBe('Acne Facial');

    $this->actingAs($user)->post(route('appointments.start-visit', $appointment), [
        'doctor_account_ID' => $doctor->account_ID,
    ])->assertRedirect();

    expect(PatientVisit::query()->count())->toBe(1);
});

test('an appointment cannot complete until its linked clinical visit starts', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $appointment = Appointment::factory()->create(['scheduled_at' => '2026-07-20 09:00:00', 'status' => 'today']);

    $this->actingAs($user)->patch(route('appointments.status', $appointment), ['action' => 'complete'])
        ->assertSessionHasErrors('appointment');
});

test('completing an appointment also finalizes its linked patient visit', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $visit = PatientVisit::factory()->create(['status' => 'in_progress', 'finalized_at' => null]);
    $appointment = Appointment::factory()->create([
        'PID' => $visit->PID,
        'visit_ID' => $visit->visit_ID,
        'scheduled_at' => '2026-07-20 09:00:00',
        'status' => 'today',
        'started_at' => now(),
    ]);

    $this->actingAs($user)->patch(route('appointments.status', $appointment), ['action' => 'complete'])->assertRedirect();

    expect($appointment->refresh()->status)->toBe('completed')
        ->and($visit->refresh()->status)->toBe('completed')
        ->and($visit->finalized_at)->not->toBeNull();
});

test('cancelled appointments release clinic capacity', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'PID' => $patient->PID,
        'scheduled_at' => '2026-07-21 13:00:00',
        'status' => 'upcoming',
    ]);

    $this->actingAs($user)->post(route('appointments.cancel', $appointment), [
        'cancellation_reason' => 'Patient is unavailable.',
    ])->assertRedirect();

    expect($appointment->refresh())
        ->status->toBe('cancelled')
        ->cancellation_reason->toBe('Patient is unavailable.');

    $this->actingAs($user)->post(route('appointments.store'), [
        'branch_ID' => $branch->branch_ID,
        'PID' => Patient::factory()->create()->PID,
        'scheduled_date' => '2026-07-21',
        'scheduled_time' => '13:00',
        'appointment_type' => 'consultation',
        'concern' => 'New booking',
    ])->assertSessionHasNoErrors();
});
