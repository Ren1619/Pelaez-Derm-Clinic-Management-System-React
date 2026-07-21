<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Feedback;
use App\Models\Patient;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-07-20 10:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

test('guests cannot access feedback management', function () {
    $this->get(route('feedback.index'))->assertRedirect(route('login'));
});

test('staff can view submitted feedback without receiving pending feedback data', function () {
    $user = User::factory()->create();
    $branch = Branch::factory()->create(['branch_name' => 'Valencia Clinic']);
    $patient = Patient::factory()->create([
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
    ]);
    $reviewed = Appointment::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'PID' => $patient->PID,
        'branch_name' => $branch->branch_name,
        'scheduled_at' => '2026-07-10 09:00:00',
        'status' => 'completed',
    ]);
    $pending = Appointment::factory()->service()->create([
        'branch_ID' => $branch->branch_ID,
        'PID' => $patient->PID,
        'branch_name' => $branch->branch_name,
        'scheduled_at' => '2026-07-15 10:00:00',
        'status' => 'completed',
    ]);
    $service = Service::factory()->create(['name' => 'Hydra Facial']);
    $pending->services()->create(['service_ID' => $service->service_ID, 'service_name' => $service->name]);
    Feedback::factory()->create([
        'appointment_ID' => $reviewed->appointment_ID,
        'rating' => 5,
        'description' => 'Excellent consultation.',
        'created_at' => '2026-07-20 09:00:00',
    ]);

    $this->actingAs($user)->get(route('feedback.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('feedback/index')
            ->where('feedbacks.data.0.appointment.patient_name', 'Juan Dela Cruz')
            ->missing('summary')
            ->missing('pendingAppointments')
            ->where('filters.date_from', '2026-07-01')
            ->where('filters.date_to', '2026-07-31'));
});

test('staff feedback management does not expose a feedback submission endpoint', function () {
    $user = User::factory()->create();
    $appointment = Appointment::factory()->create(['status' => 'completed']);

    $this->actingAs($user)->post('/feedback', [
        'appointment_ID' => $appointment->appointment_ID,
        'rating' => 4,
        'description' => 'Clear explanations and attentive staff.',
    ])->assertMethodNotAllowed();

    expect(Feedback::query()->count())->toBe(0);
});

test('rating and appointment type filters are applied to submitted feedback', function () {
    $user = User::factory()->create();
    $consultation = Appointment::factory()->create([
        'appointment_type' => 'consultation',
        'scheduled_at' => '2026-07-10 09:00:00',
        'status' => 'completed',
    ]);
    $service = Appointment::factory()->service()->create([
        'scheduled_at' => '2026-07-11 09:00:00',
        'status' => 'completed',
    ]);
    Feedback::factory()->create(['appointment_ID' => $consultation->appointment_ID, 'rating' => 5]);
    Feedback::factory()->create(['appointment_ID' => $service->appointment_ID, 'rating' => 3]);

    $this->actingAs($user)->get(route('feedback.index', [
        'rating' => 5,
        'appointment_type' => 'consultation',
    ]))->assertInertia(fn (Assert $page) => $page
        ->where('feedbacks.total', 1)
        ->where('feedbacks.data.0.rating', 5)
        ->where('feedbacks.data.0.appointment.appointment_type', 'consultation'));
});

test('feedback can be searched by appointment code patient and service', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create(['first_name' => 'Mireya', 'middle_name' => null, 'last_name' => 'Santos']);
    $appointment = Appointment::factory()->service()->create([
        'PID' => $patient->PID,
        'scheduled_at' => '2026-07-12 09:00:00',
        'status' => 'completed',
    ]);
    $appointment->services()->create(['service_ID' => null, 'service_name' => 'Signature Facial']);
    Feedback::factory()->create(['appointment_ID' => $appointment->appointment_ID, 'description' => 'Wonderful care']);

    foreach (['PDC-'.$appointment->appointment_ID, 'Mireya', 'Signature Facial', 'Wonderful'] as $search) {
        $this->actingAs($user)->get(route('feedback.index', ['search' => $search]))
            ->assertInertia(fn (Assert $page) => $page->where('feedbacks.total', 1));
    }
});

test('branch and inclusive date filters constrain feedback reporting', function () {
    $user = User::factory()->create();
    $firstBranch = Branch::factory()->create();
    $secondBranch = Branch::factory()->create();
    $inside = Appointment::factory()->create([
        'branch_ID' => $firstBranch->branch_ID,
        'scheduled_at' => '2026-06-10 09:00:00',
        'status' => 'completed',
    ]);
    $outside = Appointment::factory()->create([
        'branch_ID' => $secondBranch->branch_ID,
        'scheduled_at' => '2026-07-10 09:00:00',
        'status' => 'completed',
    ]);
    Feedback::factory()->create(['appointment_ID' => $inside->appointment_ID, 'created_at' => '2026-06-15 09:00:00']);
    Feedback::factory()->create(['appointment_ID' => $outside->appointment_ID, 'created_at' => '2026-07-15 09:00:00']);

    $this->actingAs($user)->get(route('feedback.index', [
        'branch_ID' => $firstBranch->branch_ID,
        'date_from' => '2026-06-01',
        'date_to' => '2026-06-30',
    ]))->assertInertia(fn (Assert $page) => $page
        ->where('feedbacks.total', 1)
        ->where('feedbacks.data.0.appointment.appointment_ID', $inside->appointment_ID));
});

test('all dates mode clears the original current month default', function () {
    $user = User::factory()->create();
    $appointment = Appointment::factory()->create([
        'scheduled_at' => '2025-01-10 09:00:00',
        'status' => 'completed',
    ]);
    Feedback::factory()->create(['appointment_ID' => $appointment->appointment_ID, 'created_at' => '2025-01-12 09:00:00']);

    $this->actingAs($user)->get(route('feedback.index'))->assertInertia(fn (Assert $page) => $page->where('feedbacks.total', 0));
    $this->actingAs($user)->get(route('feedback.index', ['all_dates' => 1]))->assertInertia(fn (Assert $page) => $page
        ->where('feedbacks.total', 1)
        ->where('filters.date_from', null)
        ->where('filters.date_to', null));
});
