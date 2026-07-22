<?php

use App\Enums\AccountType;
use App\Models\Patient;
use App\Models\StaffAccount;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('shared reset password link screen can be rendered', function () {
    $this->get(route('password.request'))->assertOk();
});

test('password reset links are sent through the matching account broker', function (string $modelClass) {
    Notification::fake();

    $account = $modelClass::factory()->create();

    $this->post(route('password.email'), ['email' => $account->email])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status');

    Notification::assertSentTo($account, ResetPassword::class);
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
        ResetPassword::class,
        function (ResetPassword $notification) use ($account, $accountType): bool {
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
        ResetPassword::class,
        function (ResetPassword $notification) use ($account, $accountType): bool {
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
