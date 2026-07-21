<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\SystemSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('the dashboard returns the original welcome calendar and appointment panels', function () {
    $this->travelTo('2026-07-21 08:00:00');
    SystemSetting::factory()->create([
        'business_name' => 'Pelaez Dermatology Clinic',
        'landing_hero_image' => 'system-settings/landing/hero/banner.jpg',
    ]);
    $user = User::factory()->create(['name' => 'Maria Pelaez']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('welcome.name', 'Maria Pelaez')
            ->where('welcome.business_name', 'Pelaez Dermatology Clinic')
            ->where('welcome.banner_image_url', 'http://localhost:8000/storage/system-settings/landing/hero/banner.jpg')
            ->where('filters.month', '2026-07')
            ->where('filters.date', '2026-07-21')
            ->where('filters.can_view_all_branches', true)
            ->where('calendar.month_name', 'July')
            ->where('calendar.year', 2026)
            ->has('calendar.days', 35)
            ->has('selected_appointments', 0));
});

test('the calendar counts and selected list follow the chosen branch and date', function () {
    $this->travelTo('2026-07-21 08:00:00');
    $firstBranch = Branch::factory()->create(['branch_name' => 'Valencia City']);
    $secondBranch = Branch::factory()->create(['branch_name' => 'Malaybalay City']);
    $patient = Patient::factory()->create([
        'first_name' => 'Juan',
        'middle_name' => 'M',
        'last_name' => 'Dela Cruz',
    ]);
    $user = User::factory()->create();

    Appointment::factory()->create([
        'branch_ID' => $firstBranch->branch_ID,
        'branch_name' => $firstBranch->branch_name,
        'PID' => $patient->PID,
        'scheduled_at' => now()->setTime(9, 0),
        'status' => 'today',
    ]);
    Appointment::factory()->create([
        'branch_ID' => $firstBranch->branch_ID,
        'branch_name' => $firstBranch->branch_name,
        'PID' => $patient->PID,
        'scheduled_at' => now()->addDay()->setTime(10, 0),
        'status' => 'upcoming',
    ]);
    Appointment::factory()->create([
        'branch_ID' => $secondBranch->branch_ID,
        'branch_name' => $secondBranch->branch_name,
        'PID' => $patient->PID,
        'scheduled_at' => now()->setTime(11, 0),
        'status' => 'today',
    ]);

    $todayResponse = $this->actingAs($user)->get(route('dashboard', [
        'month' => '2026-07',
        'date' => '2026-07-21',
        'branch_ID' => $firstBranch->branch_ID,
    ]));

    $todayResponse->assertSuccessful()->assertInertia(fn (Assert $page) => $page
        ->where('filters.branch_ID', $firstBranch->branch_ID)
        ->has('selected_appointments', 1, fn (Assert $appointment) => $appointment
            ->where('patient_name', 'Juan M Dela Cruz')
            ->where('time', '9:00 AM')
            ->where('branch_name', 'Valencia City')
            ->etc()));

    $todayDay = collect($todayResponse->inertiaProps('calendar.days'))
        ->firstWhere('date', '2026-07-21');
    expect($todayDay['appointment_count'])->toBe(1);

    $tomorrowResponse = $this->actingAs($user)->get(route('dashboard', [
        'month' => '2026-07',
        'date' => '2026-07-22',
        'branch_ID' => $firstBranch->branch_ID,
    ]));
    $tomorrowResponse->assertInertia(fn (Assert $page) => $page
        ->has('selected_appointments', 1)
        ->where('selected_appointments.0.status', 'upcoming'));
});

test('branch staff cannot use the dashboard filter to see another clinic', function () {
    $this->travelTo('2026-07-21 08:00:00');
    $assignedBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create([
        'branch_ID' => $assignedBranch->branch_ID,
        'first_name' => 'Clinic',
        'middle_name' => null,
        'last_name' => 'Admin',
    ]);
    $patient = Patient::factory()->create();

    Appointment::factory()->create([
        'branch_ID' => $assignedBranch->branch_ID,
        'branch_name' => $assignedBranch->branch_name,
        'PID' => $patient->PID,
        'scheduled_at' => now()->setTime(9, 0),
        'status' => 'today',
    ]);
    Appointment::factory()->create([
        'branch_ID' => $otherBranch->branch_ID,
        'branch_name' => $otherBranch->branch_name,
        'PID' => $patient->PID,
        'scheduled_at' => now()->setTime(10, 0),
        'status' => 'today',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard', ['branch_ID' => $otherBranch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('welcome.name', 'Clinic Admin')
            ->where('welcome.branch_name', $assignedBranch->branch_name)
            ->where('filters.branch_ID', $assignedBranch->branch_ID)
            ->where('filters.can_view_all_branches', false)
            ->has('branches', 0)
            ->has('selected_appointments', 1)
            ->where('selected_appointments.0.branch_name', $assignedBranch->branch_name));
});

test('dashboard filters reject invalid dates and branches', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard', [
            'month' => 'July 2026',
            'date' => 'not-a-date',
            'branch_ID' => 999999,
        ]))
        ->assertSessionHasErrors(['month', 'date', 'branch_ID']);
});
