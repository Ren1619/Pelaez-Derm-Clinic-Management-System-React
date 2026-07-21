<?php

use App\Enums\StaffModule;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('each staff role can only open the modules from the original access matrix', function () {
    $branch = Branch::factory()->create();
    $accounts = [
        'super_admin' => StaffAccount::factory()->superAdmin()->create(),
        'admin' => StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]),
        'staff' => StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]),
        'doctor' => StaffAccount::factory()->doctor()->create(['branch_ID' => $branch->branch_ID]),
    ];
    $routes = [
        StaffModule::Dashboard->value => 'dashboard',
        StaffModule::Branches->value => 'branches.index',
        StaffModule::Staff->value => 'staff.index',
        StaffModule::Patients->value => 'patients.index',
        StaffModule::Appointments->value => 'appointments.index',
        StaffModule::Feedback->value => 'feedback.index',
        StaffModule::Categories->value => 'categories.index',
        StaffModule::Services->value => 'services.index',
        StaffModule::Inventory->value => 'inventory.index',
        StaffModule::Distribution->value => 'distributions.index',
        StaffModule::Reports->value => 'reports.index',
        StaffModule::PointOfSale->value => 'pos.index',
        StaffModule::Logs->value => 'logs.index',
        StaffModule::SystemSettings->value => 'system-settings.index',
    ];

    foreach ($accounts as $account) {
        $allowedModules = array_map(
            fn (StaffModule $module): string => $module->value,
            $account->roleKey()?->modules() ?? [],
        );

        foreach ($routes as $module => $routeName) {
            $response = $this->actingAs($account)->get(route($routeName));

            if (in_array($module, $allowedModules, true)) {
                $response->assertSuccessful();
            } else {
                $response->assertForbidden();
            }
        }
    }
});

test('shared inertia permissions match the authenticated doctor role', function () {
    $doctor = StaffAccount::factory()->doctor()->create();

    $this->actingAs($doctor)
        ->get(route('patients.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $doctor->account_ID)
            ->where('auth.user.role.name', 'doctor')
            ->where('auth.user.branch.id', $doctor->branch_ID)
            ->where('auth.permissions.modules', ['patients'])
            ->where('auth.permissions.can_view_all_branches', false));
});

test('non super admins are locked to their assigned branch', function () {
    $assignedBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $assignedBranch->branch_ID]);

    $this->actingAs($admin)
        ->get(route('appointments.index', ['branch_ID' => $otherBranch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.branch_ID', $assignedBranch->branch_ID)
            ->has('branches', 1)
            ->where('branches.0.branch_ID', $assignedBranch->branch_ID));

    $this->actingAs($admin)
        ->get(route('inventory.index', ['branch_ID' => $otherBranch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.branch_ID', $assignedBranch->branch_ID)
            ->has('branches', 1)
            ->where('branches.0.branch_ID', $assignedBranch->branch_ID));

    $this->actingAs($admin)
        ->get(route('pos.index', ['branch_ID' => $otherBranch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.branch_ID', $assignedBranch->branch_ID)
            ->has('branches', 1)
            ->where('branches.0.branch_ID', $assignedBranch->branch_ID));
});

test('inactive staff cannot authenticate or access modules', function () {
    $inactiveStaff = StaffAccount::factory()->staff()->inactive()->create();

    $this->post(route('account.login.store'), [
        'email' => $inactiveStaff->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();

    $this->actingAs($inactiveStaff)
        ->get(route('dashboard'))
        ->assertForbidden();
});

test('legacy starter users are not accepted by staff login', function () {
    $user = User::factory()->create();

    $this->post(route('account.login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});
