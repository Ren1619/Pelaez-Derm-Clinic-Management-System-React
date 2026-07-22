<?php

use App\Enums\AccountType;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Notifications\AccountPasswordResetNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

test('shared reset password link screen can be rendered', function () {
    $this->get(route('password.request'))->assertOk();
});

test('invitation password links render account setup wording', function () {
    $account = Patient::factory()->create();
    $token = Password::broker('patients')->createToken($account);

    $this->get(route('password.reset', [
        'accountType' => AccountType::Patient->value,
        'token' => $token,
        'email' => $account->email,
        'account_setup' => true,
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('auth/reset-password')
        ->where('isAccountSetup', true)
    );
});

test('forgot password links retain reset password wording', function () {
    $account = Patient::factory()->create();
    $token = Password::broker('patients')->createToken($account);

    $this->get(route('password.reset', [
        'accountType' => AccountType::Patient->value,
        'token' => $token,
        'email' => $account->email,
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('auth/reset-password')
        ->where('isAccountSetup', false)
    );
});

test('password reset links are sent through the matching account broker', function (string $modelClass) {
    Notification::fake();

    $account = $modelClass::factory()->create();

    $this->post(route('password.email'), ['email' => $account->email])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status');

    Notification::assertSentTo($account, AccountPasswordResetNotification::class);
})->with([
    'staff' => StaffAccount::class,
    'patient' => Patient::class,
]);

test('unknown emails receive the same generic response without a notification', function () {
    Notification::fake();

    $response = $this->post(route('password.email'), ['email' => 'unknown@example.test']);

    $response
        ->assertSessionHasNoErrors()
        ->assertSessionHas(
            'status',
            'If an account exists for that email address, a password reset link has been sent.',
        );

    Notification::assertNothingSent();
});

test('password reset links identify the correct account type', function (
    string $modelClass,
    AccountType $accountType,
) {
    Notification::fake();

    $account = $modelClass::factory()->create();
    $this->post(route('password.email'), ['email' => $account->email]);

    Notification::assertSentTo(
        $account,
        AccountPasswordResetNotification::class,
        function (AccountPasswordResetNotification $notification) use ($account, $accountType): bool {
            expect($notification->accountType)->toBe($accountType);

            $response = $this->get(route('password.reset', [
                'accountType' => $accountType->value,
                'token' => $notification->token,
                'email' => $account->email,
            ]));

            $response->assertOk();

            return true;
        },
    );
})->with([
    'staff' => [StaffAccount::class, AccountType::Staff],
    'patient' => [Patient::class, AccountType::Patient],
]);

test('passwords can be reset through the matching account broker', function (
    string $modelClass,
    AccountType $accountType,
) {
    Notification::fake();

    $account = $modelClass::factory()->create(['password' => 'old-password']);
    $this->post(route('password.email'), ['email' => $account->email]);

    Notification::assertSentTo(
        $account,
        AccountPasswordResetNotification::class,
        function (AccountPasswordResetNotification $notification) use ($account, $accountType): bool {
            $response = $this->post(route('password.update'), [
                'account_type' => $accountType->value,
                'token' => $notification->token,
                'email' => $account->email,
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

            $response
                ->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            expect(Hash::check('new-password', $account->refresh()->password))->toBeTrue();

            return true;
        },
    );
})->with([
    'staff' => [StaffAccount::class, AccountType::Staff],
    'patient' => [Patient::class, AccountType::Patient],
]);

test('password cannot be reset through the wrong account broker', function () {
    $patient = Patient::factory()->create();

    $response = $this->post(route('password.update'), [
        'account_type' => AccountType::Staff->value,
        'token' => 'invalid-token',
        'email' => $patient->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertSessionHasErrors('email');
});

test('account setup returns a first-time setup success message', function () {
    $account = Patient::factory()->create(['password' => 'temporary-password']);
    $token = Password::broker('patients')->createToken($account);

    $this->post(route('password.update'), [
        'account_type' => AccountType::Patient->value,
        'token' => $token,
        'email' => $account->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
        'account_setup' => true,
    ])->assertRedirect(route('login'))
        ->assertSessionHas('status', 'Your account is ready. You can now log in.');
});
