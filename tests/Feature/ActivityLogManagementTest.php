<?php

use App\Models\ActivityLog;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Patient;
use App\Models\StaffAccount;
use Inertia\Testing\AssertableInertia as Assert;

test('model create update and delete actions are captured with their actor and changes', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    ActivityLog::query()->delete();
    $this->actingAs($superAdmin);

    $branch = Branch::query()->create([
        'branch_name' => 'Valencia City',
        'branch_location' => 'Roxas Street, Valencia City',
        'contact_number' => '09123456789',
        'map_link' => 'https://maps.example.com/valencia',
        'fb_link' => null,
        'branch_img' => null,
    ]);
    $branch->update(['branch_name' => 'Valencia City Clinic']);
    $branch->delete();

    $logs = ActivityLog::query()
        ->where('subject_type', 'Branch')
        ->where('subject_ID', (string) $branch->branch_ID)
        ->oldest('activity_log_ID')
        ->get();

    expect($logs)->toHaveCount(3)
        ->and($logs->pluck('action')->all())->toBe(['created', 'updated', 'deleted'])
        ->and($logs[0]->actor_ID)->toBe($superAdmin->account_ID)
        ->and($logs[0]->actor_role)->toBe('super_admin')
        ->and($logs[0]->context)->toBe('branches')
        ->and($logs[1]->old_values['branch_name'])->toBe('Valencia City')
        ->and($logs[1]->new_values['branch_name'])->toBe('Valencia City Clinic');
});

test('sensitive credentials are redacted from audit snapshots', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    ActivityLog::query()->delete();
    $this->actingAs($superAdmin);

    $patient = Patient::factory()->create(['password' => 'AuditSecret123!']);
    $log = ActivityLog::query()
        ->where('subject_type', 'Patient')
        ->where('subject_ID', (string) $patient->PID)
        ->where('action', 'created')
        ->firstOrFail();

    expect($log->new_values['password'])->toBe('[REDACTED]')
        ->and(json_encode($log->new_values))->not->toContain($patient->password);
});

test('successful module page reads are captured once without logging the logs page itself', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    Category::factory()->service()->create();
    ActivityLog::query()->delete();

    $this->actingAs($superAdmin)
        ->get(route('categories.index'))
        ->assertSuccessful();

    $readLog = ActivityLog::query()->where('action', 'viewed')->sole();

    expect($readLog->context)->toBe('categories')
        ->and($readLog->route_name)->toBe('categories.index')
        ->and($readLog->request_method)->toBe('GET');

    $this->get(route('logs.index'))->assertSuccessful();

    expect(ActivityLog::query()->where('action', 'viewed')->count())->toBe(1);
});

test('logs can be searched filtered and exported', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    ActivityLog::query()->delete();
    ActivityLog::factory()->create([
        'actor_name' => 'Maria Santos',
        'action' => 'updated',
        'context' => 'inventory',
        'subject_type' => 'Product',
        'subject_label' => 'Acne Cleanser',
        'description' => 'Updated Product "Acne Cleanser" (Quantity).',
    ]);
    ActivityLog::factory()->create([
        'actor_name' => 'Another User',
        'action' => 'created',
        'context' => 'services',
        'subject_type' => 'Service',
        'subject_label' => 'Consultation',
    ]);

    $filters = [
        'search' => 'Acne Cleanser',
        'context' => 'inventory',
        'action' => 'updated',
        'actor_type' => 'all',
        'time_period' => 'all_time',
        'per_page' => 10,
    ];

    $this->actingAs($superAdmin)
        ->get(route('logs.index', $filters))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('logs/index')
            ->where('filters.search', 'Acne Cleanser')
            ->where('filters.context', 'inventory')
            ->where('contexts.inventory', 'Inventory')
            ->where('contextCounts.all', 1)
            ->where('contextCounts.inventory', 1)
            ->has('logs.data', 1)
            ->where('logs.data.0.subject.label', 'Acne Cleanser'));

    $export = $this->get(route('logs.export', $filters));

    $export
        ->assertSuccessful()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($export->streamedContent())->toContain('Acne Cleanser');
});

test('admins only see patient activity and staff activity from their branch', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    ActivityLog::query()->delete();

    ActivityLog::factory()->create([
        'actor_name' => 'Same Branch Staff',
        'actor_branch_ID' => $branch->branch_ID,
        'actor_role' => 'staff',
    ]);
    ActivityLog::factory()->create([
        'actor_name' => 'Other Branch Staff',
        'actor_branch_ID' => $otherBranch->branch_ID,
        'actor_role' => 'staff',
    ]);
    ActivityLog::factory()->create([
        'actor_name' => 'Patient Actor',
        'actor_type' => 'patient',
        'actor_ID' => 99,
        'actor_role' => 'patient',
        'actor_branch_ID' => null,
    ]);
    ActivityLog::factory()->create([
        'actor_name' => 'Super Admin Actor',
        'actor_branch_ID' => $branch->branch_ID,
        'actor_role' => 'super_admin',
    ]);

    $this->actingAs($admin)
        ->get(route('logs.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 2)
            ->where('logs.data.0.actor.name', 'Patient Actor')
            ->where('logs.data.1.actor.name', 'Same Branch Staff'));
});

test('staff and doctors cannot open or export activity logs', function (string $role) {
    $account = StaffAccount::factory()->{$role}()->create();

    $this->actingAs($account)
        ->get(route('logs.index'))
        ->assertForbidden();

    $this->get(route('logs.export'))->assertForbidden();
})->with(['staff', 'doctor']);
