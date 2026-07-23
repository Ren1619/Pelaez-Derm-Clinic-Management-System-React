<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Distribution;
use App\Models\NewRecordEvent;
use App\Models\NewRecordEventRead;
use App\Models\PatientVisit;
use App\Models\PatientVisitDiagnosis;
use App\Models\StaffAccount;
use Inertia\Testing\AssertableInertia as Assert;

test('new appointments remain unread until each appointment is opened', function () {
    $branch = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $otherStaff = StaffAccount::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'role_ID' => $staff->role_ID,
    ]);
    $first = Appointment::factory()->create(['branch_ID' => $branch->branch_ID]);
    $second = Appointment::factory()->create(['branch_ID' => $branch->branch_ID]);
    $firstEvent = NewRecordEvent::query()
        ->where('subject_type', Appointment::class)
        ->where('subject_id', $first->appointment_ID)
        ->firstOrFail();

    $this->actingAs($staff)
        ->get(route('appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('newRecordSummary.counts.appointments', 2)
            ->where('appointments.data', function ($appointments) use ($first, $second): bool {
                $newIds = collect($appointments)
                    ->where('is_new', true)
                    ->pluck('appointment_ID');

                return $newIds->contains($first->appointment_ID)
                    && $newIds->contains($second->appointment_ID);
            }));

    $this->actingAs($staff)
        ->patch(route('new-record-events.read', $firstEvent))
        ->assertRedirect();

    $this->actingAs($staff)
        ->get(route('appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('newRecordSummary.counts.appointments', 1)
            ->where('appointments.data', function ($appointments) use ($first, $second): bool {
                $records = collect($appointments)->keyBy('appointment_ID');

                return $records[$first->appointment_ID]['is_new'] === false
                    && $records[$first->appointment_ID]['new_record_event_id'] === null
                    && $records[$second->appointment_ID]['is_new'] === true;
            }));

    $this->actingAs($otherStaff)
        ->get(route('appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('newRecordSummary.counts.appointments', 2));
});

test('marking a new record read is idempotent', function () {
    $branch = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $appointment = Appointment::factory()->create(['branch_ID' => $branch->branch_ID]);
    $event = NewRecordEvent::query()
        ->where('subject_type', Appointment::class)
        ->where('subject_id', $appointment->appointment_ID)
        ->firstOrFail();

    $this->actingAs($staff)->patch(route('new-record-events.read', $event))->assertRedirect();
    $this->actingAs($staff)->patch(route('new-record-events.read', $event))->assertRedirect();

    expect(NewRecordEventRead::query()->where('new_record_event_id', $event->id)->count())->toBe(1);
});

test('branch-scoped records cannot be seen or marked by another branch', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $appointment = Appointment::factory()->create(['branch_ID' => $otherBranch->branch_ID]);
    $event = NewRecordEvent::query()
        ->where('subject_type', Appointment::class)
        ->where('subject_id', $appointment->appointment_ID)
        ->firstOrFail();

    $this->actingAs($staff)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->missing('newRecordSummary.counts.appointments'));

    $this->actingAs($staff)
        ->patch(route('new-record-events.read', $event))
        ->assertNotFound();
});

test('distributions are new for both source and destination branches', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $unrelated = Branch::factory()->create();
    $sourceStaff = StaffAccount::factory()->staff()->create(['branch_ID' => $source->branch_ID]);
    $destinationStaff = StaffAccount::factory()->create([
        'branch_ID' => $destination->branch_ID,
        'role_ID' => $sourceStaff->role_ID,
    ]);
    $unrelatedStaff = StaffAccount::factory()->create([
        'branch_ID' => $unrelated->branch_ID,
        'role_ID' => $sourceStaff->role_ID,
    ]);
    Distribution::factory()->create([
        'from_branch_ID' => $source->branch_ID,
        'to_branch_ID' => $destination->branch_ID,
    ]);

    foreach ([$sourceStaff, $destinationStaff] as $viewer) {
        $this->actingAs($viewer)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('newRecordSummary.counts.distribution', 1));
    }

    $this->actingAs($unrelatedStaff)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->missing('newRecordSummary.counts.distribution'));
});

test('clinical records are tracked independently and updates do not create new events', function () {
    $visit = PatientVisit::factory()->create();
    $diagnosis = PatientVisitDiagnosis::factory()->create(['visit_ID' => $visit->visit_ID]);

    $event = NewRecordEvent::query()
        ->where('subject_type', PatientVisitDiagnosis::class)
        ->where('subject_id', $diagnosis->diagnosis_ID)
        ->firstOrFail();

    $diagnosis->update(['diagnosis' => 'Updated diagnosis']);

    expect(NewRecordEvent::query()
        ->where('subject_type', PatientVisitDiagnosis::class)
        ->where('subject_id', $diagnosis->diagnosis_ID)
        ->count())->toBe(1);

    $diagnosis->delete();
    expect(NewRecordEvent::query()->whereKey($event->id)->exists())->toBeFalse();
});

test('records without an event are treated as historical and seen', function () {
    $branch = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $appointment = Appointment::factory()->create(['branch_ID' => $branch->branch_ID]);

    NewRecordEvent::query()
        ->where('subject_type', Appointment::class)
        ->where('subject_id', $appointment->appointment_ID)
        ->delete();

    $this->actingAs($staff)
        ->get(route('appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data', fn ($appointments): bool => collect($appointments)
                ->firstWhere('appointment_ID', $appointment->appointment_ID)['is_new'] === false));
});
