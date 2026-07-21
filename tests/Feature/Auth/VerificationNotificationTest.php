<?php

use App\Models\StaffAccount;
use App\Notifications\StaffAccountInvitation;
use Illuminate\Support\Facades\Notification;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::emailVerification());
});

test('sends verification notification', function () {
    Notification::fake();

    $user = StaffAccount::factory()->staff()->unverified()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect(route('home'));

    Notification::assertSentTo($user, StaffAccountInvitation::class);
});

test('does not send verification notification if email is verified', function () {
    Notification::fake();

    $user = StaffAccount::factory()->staff()->create();

    $this->actingAs($user)
        ->post(route('verification.send'))
        ->assertRedirect(route('dashboard', absolute: false));

    Notification::assertNothingSent();
});
