<?php

use App\Models\AccountRole;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\SystemSetting;
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
    $category = Category::factory()->service()->create(['category_name' => 'Facial Treatments']);
    $service = Service::factory()->create([
        'category_ID' => $category->category_ID,
        'name' => 'Hydra Facial',
    ]);
    $appointment = Appointment::factory()->create([
        'scheduled_at' => '2026-07-20 09:00:00',
        'status' => 'today',
    ]);

    $this->actingAs($user)->get(route('appointments.index', ['month' => '2026-07']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('appointments/index')
            ->where('appointments.data.0.appointment_ID', $appointment->appointment_ID)
            ->where('appointments.data.0.can_edit', true)
            ->where('summary.today', 1)
            ->has('summary.pending')
            ->has('summary.upcoming')
            ->has('summary.completed')
            ->has('summary.cancelled')
            ->has('summary.incomplete')
            ->has('calendarAppointments', 1)
            ->where('services.0.service_ID', $service->service_ID)
            ->where('services.0.name', 'Hydra Facial')
            ->where('services.0.category_name', 'Facial Treatments')
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

test('availability includes pending bookings and rescheduling releases the previous slot', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $appointments = Appointment::factory()->count(2)->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'scheduled_at' => '2026-07-21 09:00:00',
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->getJson(route('appointments.availability', [
            'branch_ID' => $branch->branch_ID,
            'date' => '2026-07-21',
        ]))
        ->assertSuccessful()
        ->assertJsonPath('capacity_per_slot', 2)
        ->assertJsonPath('slots.1.value', '09:00')
        ->assertJsonPath('slots.1.booked_count', 2)
        ->assertJsonPath('slots.1.remaining_capacity', 0)
        ->assertJsonPath('slots.1.is_available', false);

    $this->actingAs($user)
        ->patch(route('appointments.update', $appointments->first()), [
            'scheduled_date' => '2026-07-21',
            'scheduled_time' => '10:00',
            'reschedule_reason' => 'The clinic needs to move this appointment.',
        ])
        ->assertSessionHasNoErrors();

    expect($appointments->first()->refresh())
        ->status->toBe('reschedule_requested')
        ->scheduled_at->format('H:i')->toBe('10:00')
        ->previous_scheduled_at->format('H:i')->toBe('09:00')
        ->reschedule_reason->toBe('The clinic needs to move this appointment.');

    $this->actingAs($user)
        ->getJson(route('appointments.availability', [
            'branch_ID' => $branch->branch_ID,
            'date' => '2026-07-21',
        ]))
        ->assertSuccessful()
        ->assertJsonPath('slots.1.remaining_capacity', 1)
        ->assertJsonPath('slots.2.booked_count', 1);
});

test('appointment slots begin at opening time and finish at closing time from system settings', function () {
    SystemSetting::factory()->create([
        'footer_opens_at' => '08:30',
        'footer_closes_at' => '10:30',
    ]);
    $user = StaffAccount::factory()->superAdmin()->create();

    $this->actingAs($user)
        ->get(route('appointments.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('timeSlots', 2)
            ->where('timeSlots.0.value', '08:30')
            ->where('timeSlots.0.label', '8:30 AM – 9:30 AM')
            ->where('timeSlots.1.value', '09:30')
            ->where('timeSlots.1.label', '9:30 AM – 10:30 AM'));
});

test('branch staff manage only appointments assigned to their clinic while super admins manage all clinics', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $branchStaff = StaffAccount::factory()->staff()->create([
        'branch_ID' => $branch->branch_ID,
    ]);
    $otherAdmin = StaffAccount::factory()->admin()->create([
        'branch_ID' => $otherBranch->branch_ID,
    ]);
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $appointment = Appointment::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'scheduled_at' => '2026-07-21 09:00:00',
        'status' => 'pending',
    ]);

    $this->actingAs($otherAdmin)
        ->patch(route('appointments.update', $appointment), [
            'scheduled_date' => '2026-07-21',
            'scheduled_time' => '10:00',
            'reschedule_reason' => 'Unauthorized branch change.',
        ])
        ->assertForbidden();

    $this->actingAs($branchStaff)
        ->patch(route('appointments.update', $appointment), [
            'scheduled_date' => '2026-07-21',
            'scheduled_time' => '10:00',
            'reschedule_reason' => 'Clinic schedule adjustment.',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($superAdmin)
        ->post(route('appointments.cancel', $appointment), [
            'cancellation_reason' => 'Cancelled by system administrator.',
        ])
        ->assertSessionHasNoErrors();

    expect($appointment->refresh()->status)->toBe('cancelled');
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

test('a pending appointment scheduled today cannot start until staff approve it', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $appointment = Appointment::factory()->create([
        'scheduled_at' => '2026-07-20 09:00:00',
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->get(route('appointments.index', ['status' => 'pending']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.status', 'pending')
            ->where('appointments.data.0.can_start', false));

    $this->actingAs($user)
        ->post(route('appointments.start-visit', $appointment))
        ->assertSessionHasErrors('appointment');

    $this->actingAs($user)
        ->patch(route('appointments.status', $appointment), ['action' => 'approve'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('appointments.start-visit', $appointment))
        ->assertSessionHasNoErrors();
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

test('starting an unassigned appointment creates a visit without selecting a doctor', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $appointment = Appointment::factory()->create([
        'doctor_account_ID' => null,
        'doctor_name' => null,
        'scheduled_at' => '2026-07-20 09:00:00',
        'status' => 'today',
    ]);

    $this->actingAs($user)
        ->post(route('appointments.start-visit', $appointment))
        ->assertRedirect(route('patients.show', [
            'patient' => $appointment->PID,
            'visit' => 1,
        ]));

    $visit = PatientVisit::query()->firstOrFail();

    expect($appointment->refresh())
        ->visit_ID->toBe($visit->visit_ID)
        ->doctor_account_ID->toBeNull()
        ->doctor_name->toBeNull()
        ->and($visit)
        ->doctor_account_ID->toBeNull()
        ->doctor_name->toBeNull();
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
