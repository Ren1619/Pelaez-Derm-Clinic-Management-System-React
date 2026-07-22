<?php

namespace App\Services;

use App\Enums\StaffRole;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\SystemNotification;
use App\Models\SystemNotificationRead;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class SystemNotificationService
{
    /** @var list<string> */
    private const PatientTypes = [
        'appointment_reminder',
        'appointment_rejected',
        'appointment_reschedule_requested',
    ];

    /** @var list<string> */
    private const StaffTypes = [
        'appointment_created_by_patient',
        'appointment_updated_by_patient',
        'inventory_low_stock',
        'distribution_inbound',
        'distribution_received',
        'feedback_submitted',
    ];

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): SystemNotification
    {
        $deduplicationKey = $attributes['deduplication_key'] ?? null;

        if (is_string($deduplicationKey) && $deduplicationKey !== '') {
            return SystemNotification::query()->updateOrCreate(
                ['deduplication_key' => $deduplicationKey],
                $attributes,
            );
        }

        return SystemNotification::query()->create($attributes);
    }

    public function removeByDeduplicationKey(string $deduplicationKey): void
    {
        SystemNotification::query()
            ->where('deduplication_key', $deduplicationKey)
            ->delete();
    }

    /** @return array{unread_count: int, items: list<array<string, mixed>>} */
    public function patientSummary(Patient $patient): array
    {
        $query = $this->patientInbox($patient);

        return [
            'unread_count' => (clone $query)->where('is_read', false)->count(),
            'items' => array_values($query->latest()->limit(10)->get()
                ->map(fn (SystemNotification $notification): array => $this->serialize($notification, $notification->is_read))
                ->all()),
        ];
    }

    /** @return array{unread_count: int, items: list<array<string, mixed>>} */
    public function staffSummary(Authenticatable $staff): array
    {
        if (! $this->staffCanReceive($staff)) {
            return ['unread_count' => 0, 'items' => []];
        }

        [$viewerType, $viewerId] = $this->staffViewer($staff);
        $query = $this->staffInbox($staff);
        $unread = (clone $query)->whereDoesntHave(
            'reads',
            fn (Builder $builder) => $builder
                ->where('viewer_type', $viewerType)
                ->where('viewer_id', $viewerId),
        );
        $items = array_values($query
            ->with(['reads' => fn ($builder) => $builder
                ->where('viewer_type', $viewerType)
                ->where('viewer_id', $viewerId)])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (SystemNotification $notification): array => $this->serialize(
                $notification,
                $notification->reads->isNotEmpty(),
            ))
            ->all());

        return [
            'unread_count' => $unread->count(),
            'items' => $items,
        ];
    }

    public function markPatientRead(Patient $patient, SystemNotification $notification): void
    {
        abort_unless($this->patientCanAccess($patient, $notification), 404);
        $notification->update(['is_read' => true]);
    }

    public function markAllPatientRead(Patient $patient): void
    {
        $this->patientInbox($patient)->where('is_read', false)->update(['is_read' => true]);
    }

    public function markStaffRead(Authenticatable $staff, SystemNotification $notification): void
    {
        abort_unless($this->staffCanAccess($staff, $notification), 404);
        [$viewerType, $viewerId] = $this->staffViewer($staff);

        SystemNotificationRead::query()->updateOrCreate([
            'system_notification_id' => $notification->id,
            'viewer_type' => $viewerType,
            'viewer_id' => $viewerId,
        ], [
            'seen_at' => now(),
        ]);
    }

    public function markAllStaffRead(Authenticatable $staff): void
    {
        abort_unless($this->staffCanReceive($staff), 403);
        [$viewerType, $viewerId] = $this->staffViewer($staff);
        $now = now();
        $rows = $this->staffInbox($staff)
            ->pluck('id')
            ->map(fn (int $notificationId): array => [
                'system_notification_id' => $notificationId,
                'viewer_type' => $viewerType,
                'viewer_id' => $viewerId,
                'seen_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        if ($rows !== []) {
            DB::table('system_notification_reads')->insertOrIgnore($rows);
        }
    }

    public function patientCanAccess(Patient $patient, SystemNotification $notification): bool
    {
        return $notification->receiver_type === 'patient'
            && $notification->receiver_id === $patient->PID
            && in_array($notification->type, self::PatientTypes, true);
    }

    public function staffCanAccess(Authenticatable $staff, SystemNotification $notification): bool
    {
        if (! $this->staffCanReceive($staff) || $notification->receiver_type !== 'staff') {
            return false;
        }

        if ($staff instanceof User || ($staff instanceof StaffAccount && $staff->isSuperAdmin())) {
            return true;
        }

        return $staff instanceof StaffAccount
            && $staff->branch_ID !== null
            && $notification->branch_id === $staff->branch_ID;
    }

    /** @return Builder<SystemNotification> */
    private function patientInbox(Patient $patient): Builder
    {
        return SystemNotification::query()
            ->where('receiver_type', 'patient')
            ->where('receiver_id', $patient->PID)
            ->whereIn('type', self::PatientTypes);
    }

    /** @return Builder<SystemNotification> */
    private function staffInbox(Authenticatable $staff): Builder
    {
        $query = SystemNotification::query()
            ->where('receiver_type', 'staff')
            ->whereIn('type', self::StaffTypes);

        if ($staff instanceof User || ($staff instanceof StaffAccount && $staff->isSuperAdmin())) {
            return $query;
        }

        if ($staff instanceof StaffAccount && $staff->branch_ID !== null) {
            return $query->where('branch_id', $staff->branch_ID);
        }

        return $query->whereRaw('1 = 0');
    }

    private function staffCanReceive(Authenticatable $staff): bool
    {
        if ($staff instanceof User) {
            return true;
        }

        return $staff instanceof StaffAccount
            && in_array($staff->roleKey(), [StaffRole::SuperAdmin, StaffRole::Admin, StaffRole::Staff], true);
    }

    /** @return array{0: string, 1: int} */
    private function staffViewer(Authenticatable $staff): array
    {
        return match (true) {
            $staff instanceof StaffAccount => ['staff_account', $staff->account_ID],
            $staff instanceof User => ['user', $staff->id],
            default => abort(401),
        };
    }

    /** @return array<string, mixed> */
    private function serialize(SystemNotification $notification, bool $isRead): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'is_read' => $isRead,
            'branch_id' => $notification->branch_id,
            'appointment_id' => $notification->appointment_id,
            'data' => $notification->data ?? [],
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }
}
