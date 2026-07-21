<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterActivityLogRequest;
use App\Models\ActivityLog;
use App\Models\StaffAccount;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    public function index(FilterActivityLogRequest $request): Response
    {
        $filters = $this->filters($request);
        $user = $this->user($request);
        $logs = $this->query($user, $filters)
            ->latest('activity_log_ID')
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(fn (ActivityLog $activityLog): array => $this->serialize($activityLog));
        $contextCounts = $this->query($user, $filters, false)
            ->selectRaw('context, count(*) as aggregate')
            ->groupBy('context')
            ->pluck('aggregate', 'context')
            ->map(fn (mixed $count): int => (int) $count)
            ->all();

        return Inertia::render('logs/index', [
            'logs' => $logs,
            'filters' => $filters,
            'contexts' => ActivityLog::contextLabels(),
            'contextCounts' => [
                'all' => array_sum($contextCounts),
                ...$contextCounts,
            ],
        ]);
    }

    public function export(FilterActivityLogRequest $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $logs = $this->query($this->user($request), $filters)
            ->oldest('activity_log_ID');

        return response()->streamDownload(function () use ($logs): void {
            $stream = fopen('php://output', 'w');

            if ($stream === false) {
                return;
            }

            fputcsv($stream, [
                'Log ID',
                'Timestamp',
                'Performed By',
                'Actor Type',
                'Role',
                'Category',
                'Action',
                'Record',
                'Description',
                'Changed Fields',
                'IP Address',
                'Route',
            ]);

            foreach ($logs->cursor() as $activityLog) {
                fputcsv($stream, array_map($this->csvCell(...), [
                    str_pad((string) $activityLog->activity_log_ID, 6, '0', STR_PAD_LEFT),
                    $activityLog->created_at?->toDateTimeString() ?? '',
                    $activityLog->actor_name,
                    Str::headline($activityLog->actor_type),
                    $activityLog->actor_role === null ? '' : Str::headline($activityLog->actor_role),
                    ActivityLog::contextLabels()[$activityLog->context] ?? Str::headline($activityLog->context),
                    Str::headline($activityLog->action),
                    $activityLog->subject_label ?? $activityLog->subject_type,
                    $activityLog->description,
                    collect(array_keys($activityLog->new_values ?? []))->map(fn (string $field): string => Str::headline($field))->implode(', '),
                    $activityLog->ip_address ?? '',
                    $activityLog->route_name ?? '',
                ]));
            }

            fclose($stream);
        }, 'activity-logs-'.now()->format('Y-m-d-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param array{search: string, context: string, action: string, actor_type: string, time_period: string, date_from: string|null, date_to: string|null, per_page: int} $filters
     * @return Builder<ActivityLog>
     */
    private function query(StaffAccount|User $user, array $filters, bool $includeContext = true): Builder
    {
        $query = ActivityLog::query()
            ->visibleTo($user)
            ->when($filters['search'], function (Builder $searchQuery, string $search): void {
                $searchQuery->where(function (Builder $nestedQuery) use ($search): void {
                    $nestedQuery
                        ->where('actor_name', 'like', "%{$search}%")
                        ->orWhere('actor_email', 'like', "%{$search}%")
                        ->orWhere('subject_label', 'like', "%{$search}%")
                        ->orWhere('subject_type', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($includeContext && $filters['context'] !== 'all', fn (Builder $contextQuery) => $contextQuery->where('context', $filters['context']))
            ->when($filters['action'] !== 'all', fn (Builder $actionQuery) => $actionQuery->where('action', $filters['action']))
            ->when($filters['actor_type'] !== 'all', fn (Builder $actorQuery) => $actorQuery->where('actor_type', $filters['actor_type']));

        return $this->applyTimePeriod($query, $filters);
    }

    /**
     * @param Builder<ActivityLog> $query
     * @param array{time_period: string, date_from: string|null, date_to: string|null} $filters
     * @return Builder<ActivityLog>
     */
    private function applyTimePeriod(Builder $query, array $filters): Builder
    {
        $now = CarbonImmutable::now();

        return match ($filters['time_period']) {
            'today' => $query->whereDate('created_at', $now->toDateString()),
            'yesterday' => $query->whereDate('created_at', $now->subDay()->toDateString()),
            'this_week' => $query->whereBetween('created_at', [$now->startOfWeek(), $now->endOfWeek()]),
            'this_month' => $query->whereBetween('created_at', [$now->startOfMonth(), $now->endOfMonth()]),
            'last_3_months' => $query->where('created_at', '>=', $now->subMonths(3)->startOfDay()),
            'last_year' => $query->where('created_at', '>=', $now->subYear()->startOfDay()),
            'custom' => $query->whereBetween('created_at', [
                CarbonImmutable::parse($filters['date_from'])->startOfDay(),
                CarbonImmutable::parse($filters['date_to'])->endOfDay(),
            ]),
            default => $query,
        };
    }

    /** @return array<string, mixed> */
    private function serialize(ActivityLog $activityLog): array
    {
        return [
            'activity_log_ID' => $activityLog->activity_log_ID,
            'actor' => [
                'type' => $activityLog->actor_type,
                'id' => $activityLog->actor_ID,
                'name' => $activityLog->actor_name,
                'email' => $activityLog->actor_email,
                'role' => $activityLog->actor_role,
                'branch_ID' => $activityLog->actor_branch_ID,
            ],
            'action' => $activityLog->action,
            'context' => $activityLog->context,
            'subject' => [
                'type' => $activityLog->subject_type,
                'id' => $activityLog->subject_ID,
                'label' => $activityLog->subject_label,
            ],
            'description' => $activityLog->description,
            'old_values' => $activityLog->old_values,
            'new_values' => $activityLog->new_values,
            'request' => [
                'method' => $activityLog->request_method,
                'route' => $activityLog->route_name,
                'url' => $activityLog->url,
                'ip_address' => $activityLog->ip_address,
                'user_agent' => $activityLog->user_agent,
            ],
            'created_at' => $activityLog->created_at?->toISOString(),
        ];
    }

    /** @return array{search: string, context: string, action: string, actor_type: string, time_period: string, date_from: string|null, date_to: string|null, per_page: int} */
    private function filters(FilterActivityLogRequest $request): array
    {
        $validated = $request->validated();

        return [
            'search' => (string) ($validated['search'] ?? ''),
            'context' => (string) $validated['context'],
            'action' => (string) $validated['action'],
            'actor_type' => (string) $validated['actor_type'],
            'time_period' => (string) $validated['time_period'],
            'date_from' => isset($validated['date_from']) ? (string) $validated['date_from'] : null,
            'date_to' => isset($validated['date_to']) ? (string) $validated['date_to'] : null,
            'per_page' => (int) $validated['per_page'],
        ];
    }

    private function user(FilterActivityLogRequest $request): StaffAccount|User
    {
        /** @var StaffAccount|User $user */
        $user = $request->user();

        return $user;
    }

    private function csvCell(mixed $value): string
    {
        $string = (string) $value;

        return preg_match('/^[=+\-@]/', $string) === 1 ? "'{$string}" : $string;
    }
}
