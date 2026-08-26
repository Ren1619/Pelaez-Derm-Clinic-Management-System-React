<?php

use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\SystemSetting;
use App\Notifications\PatientAccountInvitation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

function patientRegistrationData(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Maria',
        'middle_name' => 'Santos',
        'last_name' => 'Reyes',
        'email' => 'maria@example.com',
        'contact_number' => '09123456789',
        'address' => '123 Clinic Street, Cebu City',
        'sex' => 'Female',
        'date_of_birth' => '1995-06-15',
        'civil_status' => 'Single',
        'password' => 'StrongPass1!',
        'password_confirmation' => 'StrongPass1!',
        'privacy_accepted' => '1',
    ], $overrides);
}

test('patient registration screen includes the published privacy notice', function () {
    SystemSetting::factory()->create([
        'privacy_title' => 'Patient Privacy Notice',
        'privacy_sections' => [
            ['title' => 'Information we collect', 'content' => 'Contact and medical information.'],
        ],
    ]);

    $this->get(route('register'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('auth/register')
        ->where('privacyNotice.title', 'Patient Privacy Notice')
        ->where('privacyNotice.sections.0.title', 'Information we collect')
        ->has('passwordRules'));
});

test('only an unverified patient account is created through public registration', function () {
    Notification::fake();

    $response = $this->post(route('register.store'), patientRegistrationData());

    $response->assertRedirect(route('login'))
        ->assertSessionHas('status');

    $patient = Patient::query()->where('email', 'maria@example.com')->firstOrFail();

    expect($patient->email_verified_at)->toBeNull()
        ->and(Hash::check('StrongPass1!', $patient->password))->toBeTrue()
        ->and(StaffAccount::query()->where('email', 'maria@example.com')->exists())->toBeFalse();

    $this->assertGuest('web');
    $this->assertGuest('patient');
    Notification::assertSentTo($patient, PatientAccountInvitation::class);
});

test('privacy notice acceptance is required to register', function () {
    Notification::fake();

    $this->post(route('register.store'), patientRegistrationData([
        'privacy_accepted' => null,
    ]))->assertSessionHasErrors('privacy_accepted');

    expect(Patient::query()->where('email', 'maria@example.com')->exists())->toBeFalse();
    Notification::assertNothingSent();
});

test('registration rejects an email already used by staff', function () {
    $staff = StaffAccount::factory()->staff()->create();

    $this->post(route('register.store'), patientRegistrationData([
        'email' => $staff->email,
    ]))->assertSessionHasErrors('email');

    expect(Patient::query()->where('email', $staff->email)->exists())->toBeFalse();
});
