<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Branch;
use App\Models\Patient;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $branches = Branch::query()->orderBy('branch_ID')->get();
        $staffAccounts = StaffAccount::query()->with('role')->orderBy('account_ID')->get();
        $patients = Patient::query()->where('email', 'like', '%@pelaez.test')->orderBy('PID')->get();
        $actions = ['created', 'updated', 'viewed', 'exported'];

        if ($branches->isEmpty() || $staffAccounts->isEmpty() || $patients->isEmpty()) {
            return;
        }

        foreach (array_keys(ActivityLog::contextLabels()) as $contextIndex => $context) {
            for ($entryIndex = 0; $entryIndex < 3; $entryIndex++) {
                $sequence = ($contextIndex * 3) + $entryIndex;
                $actorType = ['staff', 'patient', 'system'][$entryIndex];
                $staff = $staffAccounts[$sequence % $staffAccounts->count()];
                $patient = $patients[$sequence % $patients->count()];
                $branch = $branches[$sequence % $branches->count()];
                $occurredAt = CarbonImmutable::now()
                    ->subMonthsNoOverflow($sequence % 12)
                    ->startOfMonth()
                    ->addDays(2 + ($contextIndex % 20))
                    ->setTime(8 + ($entryIndex * 3), 30);
                $actor = match ($actorType) {
                    'staff' => [
                        'actor_ID' => $staff->account_ID,
                        'actor_name' => $staff->full_name,
                        'actor_email' => $staff->email,
                        'actor_role' => $staff->role->role_name,
                        'actor_branch_ID' => $staff->branch_ID,
                    ],
                    'patient' => [
                        'actor_ID' => $patient->PID,
                        'actor_name' => $patient->full_name,
                        'actor_email' => $patient->email,
                        'actor_role' => 'patient',
                        'actor_branch_ID' => null,
                    ],
                    default => [
                        'actor_ID' => null,
                        'actor_name' => 'Clinic System',
                        'actor_email' => null,
                        'actor_role' => 'system',
                        'actor_branch_ID' => $branch->branch_ID,
                    ],
                };
                $subjectId = "demo-{$context}-{$entryIndex}";
                $log = ActivityLog::query()->updateOrCreate(
                    ['context' => $context, 'subject_ID' => $subjectId],
                    $actor + [
                        'actor_type' => $actorType,
                        'action' => $actions[$sequence % count($actions)],
                        'subject_type' => 'DemoRecord',
                        'subject_label' => str($context)->headline()->append(" sample {$entryIndex}")->toString(),
                        'description' => "Seeded {$context} activity for role-based log and report testing.",
                        'old_values' => $entryIndex === 1 ? ['status' => 'pending'] : null,
                        'new_values' => $entryIndex === 1 ? ['status' => 'completed'] : ['seeded' => true],
                        'request_method' => $entryIndex === 0 ? 'POST' : 'GET',
                        'route_name' => "{$context}.index",
                        'url' => "/{$context}",
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'Pelaez Demo Data Seeder',
                    ],
                );
                $log->forceFill(['created_at' => $occurredAt, 'updated_at' => $occurredAt])->saveQuietly();
            }
        }
    }
}
