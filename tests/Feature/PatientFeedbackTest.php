<?php

use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('patient feedback requires a verified patient session', function () {
    $this->get(route('patient.feedback.index'))
        ->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create())
        ->get(route('patient.feedback.index'))
        ->assertRedirect(route('login'));
});

test('verified patients can log in to their portal', function () {
    $patient = Patient::factory()->create([
        'email' => 'patient@example.test',
        'password' => 'password',
    ]);

    $this->post(route('account.login.store'), [
        'email' => $patient->email,
        'password' => 'password',
        'remember' => 'on',
    ])->assertRedirect(route('patient.health-record.index'));

    $this->assertAuthenticatedAs($patient, 'patient');
});

test('unverified patients cannot enter the patient portal', function () {
    $patient = Patient::factory()->unverified()->create([
        'email' => 'unverified@example.test',
        'password' => 'password',
    ]);

    $this->post(route('account.login.store'), [
        'email' => $patient->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest('patient');
});

test('patients only see their own pending appointments and submitted feedback', function () {
    $patient = Patient::factory()->create([
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
    ]);
    $otherPatient = Patient::factory()->create();

    $ownPending = Appointment::factory()->service()->create([
        'PID' => $patient->PID,
        'status' => 'completed',
        'scheduled_at' => '2026-07-18 09:00:00',
    ]);
    $ownPending->services()->create([
        'service_ID' => null,
        'service_name' => 'Hydra Facial',
    ]);
    Appointment::factory()->create([
        'PID' => $patient->PID,
        'status' => 'upcoming',
    ]);

    $ownReviewed = Appointment::factory()->create([
        'PID' => $patient->PID,
        'status' => 'completed',
    ]);
    $ownFeedback = Feedback::factory()->create([
        'appointment_ID' => $ownReviewed->appointment_ID,
        'rating' => 5,
    ]);

    $otherPending = Appointment::factory()->create([
        'PID' => $otherPatient->PID,
        'status' => 'completed',
    ]);
    $otherReviewed = Appointment::factory()->create([
        'PID' => $otherPatient->PID,
        'status' => 'completed',
    ]);
    Feedback::factory()->create([
        'appointment_ID' => $otherReviewed->appointment_ID,
        'rating' => 1,
    ]);

    $this->actingAs($patient, 'patient')
        ->get(route('patient.feedback.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patient/feedback/index')
            ->where('patient.PID', $patient->PID)
            ->has('pendingAppointments', 1)
            ->where('pendingAppointments.0.appointment_ID', $ownPending->appointment_ID)
            ->where('pendingAppointments.0.services.0.service_name', 'Hydra Facial')
            ->where('feedbacks.total', 1)
            ->where('feedbacks.data.0.feedback_ID', $ownFeedback->feedback_ID)
            ->where('feedbacks.data.0.appointment.PID', $patient->PID));

    expect($otherPending->appointment_ID)->not->toBe($ownPending->appointment_ID);
});

test('patients can submit feedback once for their own completed appointment', function () {
    $patient = Patient::factory()->create();
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID]);
    $appointment = Appointment::factory()->create([
        'PID' => $patient->PID,
        'visit_ID' => $visit->visit_ID,
        'status' => 'completed',
        'completed_at' => now(),
    ]);

    $payload = [
        'appointment_ID' => $appointment->appointment_ID,
        'rating' => 4,
        'description' => 'Clear explanations and attentive staff.',
    ];

    $this->actingAs($patient, 'patient')
        ->post(route('patient.feedback.store'), $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $feedback = Feedback::query()->firstOrFail();
    expect($feedback)
        ->appointment_ID->toBe($appointment->appointment_ID)
        ->rating->toBe(4)
        ->description->toBe('Clear explanations and attentive staff.')
        ->and($feedback->appointment->visit_ID)->toBe($visit->visit_ID);

    $this->actingAs($patient, 'patient')
        ->post(route('patient.feedback.store'), $payload)
        ->assertSessionHasErrors('appointment_ID');

    expect(Feedback::query()->count())->toBe(1);
});

test('patients cannot submit feedback for another patients appointment', function () {
    $patient = Patient::factory()->create();
    $otherAppointment = Appointment::factory()->create(['status' => 'completed']);

    $this->actingAs($patient, 'patient')
        ->post(route('patient.feedback.store'), [
            'appointment_ID' => $otherAppointment->appointment_ID,
            'rating' => 5,
        ])
        ->assertForbidden();

    expect(Feedback::query()->count())->toBe(0);
});

test('patients cannot submit feedback before an appointment is completed', function () {
    $patient = Patient::factory()->create();
    $appointment = Appointment::factory()->create([
        'PID' => $patient->PID,
        'status' => 'upcoming',
    ]);

    $this->actingAs($patient, 'patient')
        ->post(route('patient.feedback.store'), [
            'appointment_ID' => $appointment->appointment_ID,
            'rating' => 5,
        ])
        ->assertSessionHasErrors('appointment_ID');

    expect(Feedback::query()->count())->toBe(0);
});

test('patients can log out of their portal', function () {
    $patient = Patient::factory()->create();

    $this->actingAs($patient, 'patient')
        ->post(route('patient.logout'))
        ->assertRedirect(route('login'));

    $this->assertGuest('patient');
});
