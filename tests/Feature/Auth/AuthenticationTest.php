<?php

use App\Models\Patient;
use App\Models\StaffAccount;
use Illuminate\Support\Facades\DB;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('users can authenticate using the login screen', function () {
    $user = StaffAccount::factory()->staff()->create();

    $response = $this->post(route('account.login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = StaffAccount::factory()->staff()->create();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->account_ID);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = StaffAccount::factory()->staff()->create();

    $this->post(route('account.login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = StaffAccount::factory()->staff()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('home'));

    $this->assertGuest();
});

test('users are rate limited', function () {
    $user = StaffAccount::factory()->staff()->create();

    foreach (range(1, 4) as $attempt) {
        $this->post(route('account.login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');
    }

    $response = $this->post(route('account.login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors(['email', 'lockout_seconds']);

    $seconds = (int) session('errors')->get('lockout_seconds')[0];

    expect($seconds)->toBeGreaterThanOrEqual(299)
        ->and($seconds)->toBeLessThanOrEqual(300);

    $this->post(route('account.login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertSessionHasErrors('lockout_seconds');

    $this->assertGuest();
});

test('unverified patients cannot authenticate', function () {
    $patient = Patient::factory()->unverified()->create([
        'password' => 'password',
    ]);

    $this->post(route('account.login.store'), [
        'email' => $patient->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest('patient');
});

test('verified patients authenticate from the shared login screen', function () {
    $patient = Patient::factory()->create(['password' => 'password']);

    $response = $this->post(route('account.login.store'), [
        'email' => $patient->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($patient, 'patient');
    $response->assertRedirect(route('patient.health-record.index'));
});

test('account lookup uses no more than two indexed account queries', function () {
    $patient = Patient::factory()->create(['password' => 'password']);
    $accountQueries = [];

    DB::listen(function ($query) use (&$accountQueries): void {
        if (str_contains($query->sql, 'staff_accounts') || str_contains($query->sql, 'patients')) {
            $accountQueries[] = $query->sql;
        }
    });

    $this->post(route('account.login.store'), [
        'email' => $patient->email,
        'password' => 'password',
    ])->assertRedirect(route('patient.health-record.index'));

    expect($accountQueries)->toHaveCount(2)
        ->each->toContain('email');
});
