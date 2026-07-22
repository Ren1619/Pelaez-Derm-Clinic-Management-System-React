<?php

use App\Models\Patient;
use App\Models\StaffAccount;
use App\Notifications\PatientAccountInvitation;
use App\Notifications\StaffAccountInvitation;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

test('shared resend verification screen can be rendered', function () {
    $this->get(route('account.verification.request'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/resend-verification'));
});

test('unverified accounts receive a fresh verification and setup email', function (
    string $modelClass,
    string $notificationClass,
    string $passwordBroker,
) {
    Notification::fake();

    $account = $modelClass::factory()->unverified()->create();

    $this->post(route('account.verification.send'), ['email' => $account->email])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status');

    Notification::assertSentTo(
        $account,
        $notificationClass,
        function ($notification) use ($account, $passwordBroker): bool {
            return $notification->passwordResetToken !== null
                && Password::broker($passwordBroker)->tokenExists(
                    $account,
                    $notification->passwordResetToken,
                );
        },
    );
})->with([
    'staff' => [StaffAccount::class, StaffAccountInvitation::class, 'staff_accounts'],
    'patient' => [Patient::class, PatientAccountInvitation::class, 'patients'],
]);

test('verified and unknown accounts receive the same generic response', function () {
    Notification::fake();
    $verifiedStaff = StaffAccount::factory()->create();

    foreach ([$verifiedStaff->email, 'unknown@example.test'] as $email) {
        $this->post(route('account.verification.send'), ['email' => $email])
            ->assertSessionHas(
                'status',
                'If an unverified account exists for that email address, a new verification link has been sent.',
            );
    }

    Notification::assertNothingSent();
});

test('inactive staff accounts do not receive verification emails', function () {
    Notification::fake();
    $inactiveStaff = StaffAccount::factory()->inactive()->unverified()->create();

    $this->post(route('account.verification.send'), ['email' => $inactiveStaff->email])
        ->assertSessionHasNoErrors();

    Notification::assertNothingSent();
});
