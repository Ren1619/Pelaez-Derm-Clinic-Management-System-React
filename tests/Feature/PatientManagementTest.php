<?php

use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\User;
use App\Notifications\PatientAccountInvitation;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from patient management', function () {
    $this->get(route('patients.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can search and filter patients', function () {
    $user = User::factory()->create();

    Patient::factory()->create([
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'email' => 'maria.patient@example.com',
    ]);
    Patient::factory()->unverified()->create([
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
        'email' => 'juan.patient@example.com',
    ]);

    $this->actingAs($user)
        ->get(route('patients.index', [
            'search' => 'Juan Dela Cruz',
            'verification' => 'unverified',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('patients/index')
            ->where('filters.search', 'Juan Dela Cruz')
            ->where('filters.verification', 'unverified')
            ->where('summary.total', 2)
            ->where('summary.verified', 1)
            ->where('summary.unverified', 1)
            ->has('patients.data', 1)
            ->where('patients.data.0.email', 'juan.patient@example.com')
            ->where('patients.data.0.full_name', 'Juan Dela Cruz'));
});

test('authenticated users can create a patient with a secure password setup token', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('patients.index'))
        ->post(route('patients.store'), [
            'first_name' => '  Ana Maria  ',
            'middle_name' => 'Reyes',
            'last_name' => 'Dela Cruz',
            'email' => '  ANA.PATIENT@EXAMPLE.COM ',
            'contact_number' => '09123456789',
            'address' => '  12 Sampaguita St., Quezon City  ',
            'sex' => 'Female',
            'date_of_birth' => '1994-05-10',
            'civil_status' => 'Single',
        ])
        ->assertRedirect(route('patients.index'))
        ->assertSessionHasNoErrors();

    $patient = Patient::query()->where('email', 'ana.patient@example.com')->firstOrFail();

    expect($patient)
        ->first_name->toBe('Ana Maria')
        ->email_verified_at->toBeNull()
        ->full_name->toBe('Ana Maria Reyes Dela Cruz');

    Notification::assertSentTo(
        $patient,
        PatientAccountInvitation::class,
        fn (PatientAccountInvitation $notification): bool => $notification->passwordResetToken !== null
            && Password::broker('patients')->tokenExists($patient, $notification->passwordResetToken),
    );
});

test('patient input and cross account email uniqueness are validated', function () {
    $user = User::factory()->create(['email' => 'existing@example.com']);
    StaffAccount::factory()->create(['email' => 'staff-existing@example.com']);

    $payload = [
        'first_name' => 'Invalid123',
        'last_name' => 'Patient',
        'email' => 'existing@example.com',
        'contact_number' => '1234',
        'address' => 'Clinic address',
        'sex' => 'Unknown',
        'date_of_birth' => now()->addDay()->toDateString(),
        'civil_status' => 'Partnered',
    ];

    $this->actingAs($user)
        ->from(route('patients.index'))
        ->post(route('patients.store'), $payload)
        ->assertRedirect(route('patients.index'))
        ->assertSessionHasErrors([
            'first_name',
            'email',
            'contact_number',
            'sex',
            'date_of_birth',
            'civil_status',
        ]);

    $this->actingAs($user)
        ->from(route('patients.index'))
        ->post(route('patients.store'), [
            ...$payload,
            'first_name' => 'Valid',
            'email' => 'staff-existing@example.com',
            'contact_number' => '09123456789',
            'sex' => 'Female',
            'date_of_birth' => '1990-01-01',
            'civil_status' => 'Single',
        ])
        ->assertSessionHasErrors('email');
});

test('patients can be updated while retaining their password', function () {
    Notification::fake();

    $user = User::factory()->create();
    $patient = Patient::factory()->create([
        'email' => 'old.patient@example.com',
        'password' => 'ExistingPassword1!',
    ]);
    $oldPasswordHash = $patient->password;

    $this->actingAs($user)
        ->from(route('patients.index'))
        ->put(route('patients.update', $patient), [
            'first_name' => 'Updated',
            'middle_name' => null,
            'last_name' => 'Patient',
            'email' => 'new.patient@example.com',
            'contact_number' => '09987654321',
            'address' => 'Updated patient address',
            'sex' => 'Male',
            'date_of_birth' => '1988-06-15',
            'civil_status' => 'Married',
        ])
        ->assertRedirect(route('patients.index'))
        ->assertSessionHasNoErrors();

    $patient->refresh();

    expect($patient)
        ->email->toBe('new.patient@example.com')
        ->email_verified_at->toBeNull()
        ->password->toBe($oldPasswordHash)
        ->full_name->toBe('Updated Patient');

    Notification::assertSentTo($patient, PatientAccountInvitation::class);
});

test('a patient can be updated without changing their email', function () {
    Notification::fake();

    $user = User::factory()->create();
    $patient = Patient::factory()->create(['email' => 'same.patient@example.com']);

    $this->actingAs($user)
        ->put(route('patients.update', $patient), [
            'first_name' => 'Same',
            'middle_name' => null,
            'last_name' => 'Patient',
            'email' => 'same.patient@example.com',
            'contact_number' => '09987654321',
            'address' => 'Updated patient address',
            'sex' => 'Female',
            'date_of_birth' => '1992-03-20',
            'civil_status' => 'Single',
        ])
        ->assertSessionHasNoErrors();

    expect($patient->refresh()->hasVerifiedEmail())->toBeTrue();
    Notification::assertNothingSent();
});

test('authenticated users can delete patients', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    $this->actingAs($user)
        ->delete(route('patients.destroy', $patient))
        ->assertSessionHasNoErrors();

    $this->assertModelMissing($patient);
});

test('a valid signed link verifies a patient email', function () {
    $patient = Patient::factory()->unverified()->create();
    $url = URL::temporarySignedRoute(
        'patients.verification.verify',
        now()->addHour(),
        [
            'patient' => $patient->getKey(),
            'hash' => sha1($patient->email),
        ],
    );

    $this->get($url)
        ->assertRedirect(route('login'));

    expect($patient->refresh()->hasVerifiedEmail())->toBeTrue();
});

test('an invalid patient verification hash is rejected', function () {
    $patient = Patient::factory()->unverified()->create();
    $url = URL::temporarySignedRoute(
        'patients.verification.verify',
        now()->addHour(),
        [
            'patient' => $patient->getKey(),
            'hash' => sha1('wrong@example.com'),
        ],
    );

    $this->get($url)->assertForbidden();

    expect($patient->refresh()->hasVerifiedEmail())->toBeFalse();
});

test('a new patient invitation verifies email and continues to password setup', function () {
    $patient = Patient::factory()->unverified()->create();
    $token = Password::broker('patients')->createToken($patient);
    $url = URL::temporarySignedRoute(
        'patients.verification.verify',
        now()->addHour(),
        [
            'patient' => $patient->getKey(),
            'hash' => sha1($patient->email),
            'password_reset_token' => $token,
        ],
    );

    $this->get($url)->assertRedirect(route('password.reset', [
        'accountType' => 'patient',
        'token' => $token,
        'email' => $patient->email,
    ]));

    expect($patient->refresh()->hasVerifiedEmail())->toBeTrue();
});
