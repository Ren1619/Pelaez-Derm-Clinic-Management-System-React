<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Product;
use App\Models\StaffAccount;
use App\Models\SystemNotification;
use App\Services\DistributionService;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('branch notifications have a separate seen state for each staff account', function () {
    $branch = Branch::factory()->create();
    $firstStaff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $secondStaff = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $firstStaff->role_ID,
    ]);
    $notification = SystemNotification::factory()->create([
        'receiver_type' => 'staff',
        'receiver_id' => null,
        'branch_id' => $branch->branch_ID,
        'type' => 'appointment_created_by_patient',
    ]);

    $this->actingAs($firstStaff)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notificationSummary.unread_count', 1)
            ->where('notificationSummary.items.0.id', $notification->id)
            ->where('notificationSummary.items.0.is_read', false));

    $this->actingAs($firstStaff)
        ->patch(route('notifications.read', $notification))
        ->assertRedirect();

    $this->actingAs($firstStaff)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('notificationSummary.unread_count', 0));

    $this->actingAs($secondStaff)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('notificationSummary.unread_count', 1));
});

test('staff cannot see or mark another branch notification', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $notification = SystemNotification::factory()->create([
        'receiver_type' => 'staff',
        'receiver_id' => null,
        'branch_id' => $otherBranch->branch_ID,
        'type' => 'feedback_submitted',
    ]);

    $this->actingAs($staff)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notificationSummary.unread_count', 0)
            ->has('notificationSummary.items', 0));

    $this->actingAs($staff)
        ->patch(route('notifications.read', $notification))
        ->assertNotFound();
});

test('patients only see and mark their own important notifications', function () {
    $patient = Patient::factory()->create();
    $otherPatient = Patient::factory()->create();
    $own = SystemNotification::factory()->create([
        'receiver_id' => $patient->PID,
        'type' => 'appointment_rejected',
    ]);
    $other = SystemNotification::factory()->create([
        'receiver_id' => $otherPatient->PID,
        'type' => 'appointment_reminder',
    ]);

    $this->actingAs($patient, 'patient')
        ->get(route('patient.health-record.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notificationSummary.unread_count', 1)
            ->where('notificationSummary.items.0.id', $own->id));

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.notifications.read', $own))
        ->assertRedirect();
    expect($own->refresh()->is_read)->toBeTrue();

    $this->actingAs($patient, 'patient')
        ->patch(route('patient.notifications.read', $other))
        ->assertNotFound();
});

test('patient appointment actions notify branch staff and staff rejection notifies the patient', function () {
    $patient = Patient::factory()->create([
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
    ]);
    $branch = Branch::factory()->create(['branch_name' => 'Valencia City']);
    $staff = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    $appointmentDate = now()->next('Monday')->toDateString();

    $this->actingAs($patient, 'patient')->post(route('patient.appointments.store'), [
        'branch_ID' => $branch->branch_ID,
        'scheduled_date' => $appointmentDate,
        'scheduled_time' => '09:00',
        'appointment_type' => 'consultation',
        'concern' => 'Persistent acne',
    ])->assertSessionHasNoErrors();

    $appointment = Appointment::query()->firstOrFail();
    $staffNotification = SystemNotification::query()
        ->where('type', 'appointment_created_by_patient')
        ->firstOrFail();
    expect($staffNotification)
        ->receiver_type->toBe('staff')
        ->receiver_id->toBeNull()
        ->branch_id->toBe($branch->branch_ID)
        ->and($staffNotification->message)->toContain('Juan Dela Cruz');

    $this->actingAs($staff)->post(route('appointments.cancel', $appointment), [
        'cancellation_reason' => 'Please select a different clinic date.',
    ])->assertSessionHasNoErrors();

    $patientNotification = SystemNotification::query()
        ->where('type', 'appointment_rejected')
        ->firstOrFail();
    expect($patientNotification)
        ->receiver_type->toBe('patient')
        ->receiver_id->toBe($patient->PID)
        ->reason->toBe('Please select a different clinic date.');
});

test('appointment reminders are generated once for appointments within 24 hours', function () {
    Carbon::setTestNow('2026-07-21 08:00:00');
    $patient = Patient::factory()->create();
    $near = Appointment::factory()->create([
        'PID' => $patient->PID,
        'status' => 'upcoming',
        'scheduled_at' => now()->addHours(20),
    ]);
    Appointment::factory()->create([
        'PID' => $patient->PID,
        'status' => 'upcoming',
        'scheduled_at' => now()->addDays(2),
    ]);

    $this->artisan('appointments:generate-reminders')->assertSuccessful();
    $this->artisan('appointments:generate-reminders')->assertSuccessful();

    expect(SystemNotification::query()->where('type', 'appointment_reminder')->count())->toBe(1)
        ->and(SystemNotification::query()->where('type', 'appointment_reminder')->firstOrFail()->appointment_id)
        ->toBe($near->appointment_ID);

    Carbon::setTestNow();
});

test('very low inventory creates one branch alert until the batch is restocked', function () {
    $branch = Branch::factory()->create();
    $product = Product::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'name' => 'Gentle Cleanser',
        'quantity' => 25,
        'expiration_date' => today()->addYear(),
    ]);

    expect(SystemNotification::query()->where('type', 'inventory_low_stock')->count())->toBe(0);

    $product->update(['quantity' => 20]);
    $product->update(['quantity' => 5]);

    $notification = SystemNotification::query()->where('type', 'inventory_low_stock')->firstOrFail();
    expect($notification)
        ->branch_id->toBe($branch->branch_ID)
        ->and($notification->message)->toContain('5');
    expect(SystemNotification::query()->where('type', 'inventory_low_stock')->count())->toBe(1);

    $product->update(['quantity' => 30]);
    expect(SystemNotification::query()->where('type', 'inventory_low_stock')->count())->toBe(0);

    Product::query()->whereKey($product->product_ID)->update(['quantity' => 10]);
    $this->artisan('inventory:sync-low-stock-notifications')->assertSuccessful();
    expect(SystemNotification::query()->where('type', 'inventory_low_stock')->count())->toBe(1);
});

test('distribution creation and receipt notify the destination and source branches', function () {
    $source = Branch::factory()->create(['branch_name' => 'Source Clinic']);
    $destination = Branch::factory()->create(['branch_name' => 'Destination Clinic']);
    $category = Category::factory()->product()->create();
    $creator = StaffAccount::factory()->admin()->create(['branch_ID' => $source->branch_ID]);
    $product = Product::factory()->recycle([$source, $category])->create(['quantity' => 50]);

    $distribution = app(DistributionService::class)->create([
        'from_branch_ID' => $source->branch_ID,
        'to_branch_ID' => $destination->branch_ID,
        'items' => [['product_ID' => $product->product_ID, 'quantity' => 5]],
    ], $creator);

    expect(SystemNotification::query()->where('type', 'distribution_inbound')->firstOrFail()->branch_id)
        ->toBe($destination->branch_ID);

    app(DistributionService::class)->send($distribution);
    app(DistributionService::class)->receive($distribution->refresh());

    expect(SystemNotification::query()->where('type', 'distribution_received')->firstOrFail()->branch_id)
        ->toBe($source->branch_ID);
});

test('patient feedback notifies staff at the appointment branch', function () {
    $patient = Patient::factory()->create();
    $branch = Branch::factory()->create();
    $visit = PatientVisit::factory()->create(['PID' => $patient->PID, 'branch_ID' => $branch->branch_ID]);
    $appointment = Appointment::factory()->create([
        'PID' => $patient->PID,
        'branch_ID' => $branch->branch_ID,
        'visit_ID' => $visit->visit_ID,
        'status' => 'completed',
    ]);

    $this->actingAs($patient, 'patient')->post(route('patient.feedback.store'), [
        'appointment_ID' => $appointment->appointment_ID,
        'rating' => 5,
        'description' => 'Excellent care.',
    ])->assertSessionHasNoErrors();

    $notification = SystemNotification::query()->where('type', 'feedback_submitted')->firstOrFail();
    expect($notification)
        ->branch_id->toBe($branch->branch_ID)
        ->receiver_type->toBe('staff')
        ->and($notification->message)->toContain('5-star');
});
