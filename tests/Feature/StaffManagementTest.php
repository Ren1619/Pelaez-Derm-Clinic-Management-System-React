<?php

use App\Models\AccountRole;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Models\User;
use App\Notifications\StaffAccountInvitation;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

function createStaffRoles(): array
{
    return [
        'super_admin' => AccountRole::create(['role_name' => 'super_admin']),
        'admin' => AccountRole::create(['role_name' => 'admin']),
        'staff' => AccountRole::create(['role_name' => 'staff']),
        'doctor' => AccountRole::create(['role_name' => 'doctor']),
    ];
}

test('guests are redirected from staff management', function () {
    $this->get(route('staff.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view search and filter staff', function () {
    $roles = createStaffRoles();
    $branch = Branch::factory()->create(['branch_name' => 'Valencia City']);
    $otherBranch = Branch::factory()->create(['branch_name' => 'Malaybalay City']);
    $user = User::factory()->create();

    StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $roles['doctor']->role_ID,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'email' => 'maria@example.com',
    ]);
    StaffAccount::factory()->inactive()->create([
        'branch_ID' => $otherBranch->branch_ID,
        'role_ID' => $roles['staff']->role_ID,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'email' => 'juan@example.com',
    ]);

    $this->actingAs($user)
        ->get(route('staff.index', [
            'search' => 'Maria Santos',
            'branch_ID' => $branch->branch_ID,
            'role_ID' => $roles['doctor']->role_ID,
            'status' => 'active',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('staff/index')
            ->where('filters.search', 'Maria Santos')
            ->where('filters.branch_ID', $branch->branch_ID)
            ->where('summary.total', 2)
            ->has('staffAccounts.data', 1)
            ->where('staffAccounts.data.0.email', 'maria@example.com')
            ->where('staffAccounts.data.0.branch.branch_name', 'Valencia City')
            ->where('staffAccounts.data.0.role.role_name', 'doctor'));
});

test('authenticated users can create staff with a secure password setup token', function () {
    Notification::fake();

    $roles = createStaffRoles();
    $branch = Branch::factory()->create();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('staff.index'))
        ->post(route('staff.store'), [
            'branch_ID' => $branch->branch_ID,
            'role_ID' => $roles['doctor']->role_ID,
            'first_name' => 'Ana Maria',
            'middle_name' => 'Reyes',
            'last_name' => 'Dela Cruz',
            'contact_number' => '09123456789',
            'email' => 'ana@example.com',
        ])
        ->assertRedirect(route('staff.index'))
        ->assertSessionHasNoErrors();

    $staffAccount = StaffAccount::query()->where('email', 'ana@example.com')->firstOrFail();

    expect($staffAccount)
        ->email_verified_at->toBeNull()
        ->is_active->toBeTrue()
        ->branch_ID->toBe($branch->branch_ID);

    Notification::assertSentTo(
        $staffAccount,
        StaffAccountInvitation::class,
        fn (StaffAccountInvitation $notification): bool => $notification->passwordResetToken !== null
            && Password::broker('staff_accounts')->tokenExists($staffAccount, $notification->passwordResetToken),
    );
});

test('super admins may be assigned to all branches', function () {
    Notification::fake();

    $roles = createStaffRoles();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('staff.store'), [
            'role_ID' => $roles['super_admin']->role_ID,
            'first_name' => 'Global',
            'last_name' => 'Administrator',
            'contact_number' => '09123456789',
            'email' => 'global@example.com',
        ])
        ->assertSessionHasNoErrors();

    expect(StaffAccount::query()->where('email', 'global@example.com')->value('branch_ID'))
        ->toBeNull();
});

test('staff input and cross account email uniqueness are validated', function () {
    $roles = createStaffRoles();
    $user = User::factory()->create(['email' => 'existing@example.com']);

    $this->actingAs($user)
        ->from(route('staff.index'))
        ->post(route('staff.store'), [
            'role_ID' => $roles['staff']->role_ID,
            'first_name' => 'Invalid123',
            'last_name' => 'Name',
            'contact_number' => '1234',
            'email' => 'existing@example.com',
        ])
        ->assertRedirect(route('staff.index'))
        ->assertSessionHasErrors([
            'branch_ID',
            'first_name',
            'contact_number',
            'email',
        ]);
});

test('staff can be updated without changing the password', function () {
    Notification::fake();

    $roles = createStaffRoles();
    $branch = Branch::factory()->create();
    $user = User::factory()->create();
    $staffAccount = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $roles['staff']->role_ID,
        'email' => 'old@example.com',
        'password' => 'ExistingPassword1!',
    ]);
    $oldPasswordHash = $staffAccount->password;

    $this->actingAs($user)
        ->from(route('staff.index'))
        ->put(route('staff.update', $staffAccount), [
            'branch_ID' => $branch->branch_ID,
            'role_ID' => $roles['doctor']->role_ID,
            'first_name' => 'Updated',
            'middle_name' => null,
            'last_name' => 'Account',
            'contact_number' => '09987654321',
            'email' => 'new@example.com',
            'password' => null,
            'password_confirmation' => null,
        ])
        ->assertRedirect(route('staff.index'))
        ->assertSessionHasNoErrors();

    $staffAccount->refresh();

    expect($staffAccount)
        ->email->toBe('new@example.com')
        ->role_ID->toBe($roles['doctor']->role_ID)
        ->email_verified_at->toBeNull()
        ->password->toBe($oldPasswordHash);

    Notification::assertSentTo($staffAccount, StaffAccountInvitation::class);
});

test('regular staff account status can be toggled', function () {
    $roles = createStaffRoles();
    $branch = Branch::factory()->create();
    $user = User::factory()->create();
    $staffAccount = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $roles['staff']->role_ID,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->patch(route('staff.status', $staffAccount))
        ->assertSessionHasNoErrors();

    expect($staffAccount->refresh()->is_active)->toBeFalse();
});

test('the final active super admin cannot be disabled', function () {
    $roles = createStaffRoles();
    $user = User::factory()->create();
    $superAdmin = StaffAccount::factory()->create([
        'branch_ID' => null,
        'role_ID' => $roles['super_admin']->role_ID,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->patch(route('staff.status', $superAdmin))
        ->assertSessionHasErrors('status');

    expect($superAdmin->refresh()->is_active)->toBeTrue();
});

test('the final active branch admin cannot be disabled', function () {
    $roles = createStaffRoles();
    $branch = Branch::factory()->create();
    $user = User::factory()->create();
    $admin = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $roles['admin']->role_ID,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->patch(route('staff.status', $admin))
        ->assertSessionHasErrors('status');

    expect($admin->refresh()->is_active)->toBeTrue();
});

test('a valid signed link verifies a staff email', function () {
    $roles = createStaffRoles();
    $staffAccount = StaffAccount::factory()->unverified()->create([
        'role_ID' => $roles['staff']->role_ID,
    ]);
    $url = URL::temporarySignedRoute(
        'staff.verification.verify',
        now()->addHour(),
        [
            'staffAccount' => $staffAccount->getKey(),
            'hash' => sha1($staffAccount->email),
        ],
    );

    $this->get($url)
        ->assertRedirect(route('login'));

    expect($staffAccount->refresh()->hasVerifiedEmail())->toBeTrue();
});

test('an invalid staff verification hash is rejected', function () {
    $roles = createStaffRoles();
    $staffAccount = StaffAccount::factory()->unverified()->create([
        'role_ID' => $roles['staff']->role_ID,
    ]);
    $url = URL::temporarySignedRoute(
        'staff.verification.verify',
        now()->addHour(),
        [
            'staffAccount' => $staffAccount->getKey(),
            'hash' => sha1('wrong@example.com'),
        ],
    );

    $this->get($url)->assertForbidden();

    expect($staffAccount->refresh()->hasVerifiedEmail())->toBeFalse();
});

test('a new staff invitation verifies email and continues to password setup', function () {
    $roles = createStaffRoles();
    $staffAccount = StaffAccount::factory()->unverified()->create([
        'role_ID' => $roles['staff']->role_ID,
    ]);
    $token = Password::broker('staff_accounts')->createToken($staffAccount);
    $url = URL::temporarySignedRoute(
        'staff.verification.verify',
        now()->addHour(),
        [
            'staffAccount' => $staffAccount->getKey(),
            'hash' => sha1($staffAccount->email),
            'password_reset_token' => $token,
        ],
    );

    $this->get($url)->assertRedirect(route('password.reset', [
        'accountType' => 'staff',
        'token' => $token,
        'email' => $staffAccount->email,
        'account_setup' => true,
    ]));

    expect($staffAccount->refresh()->hasVerifiedEmail())->toBeTrue();
});
