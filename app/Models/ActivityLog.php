<?php

namespace App\Models;

use Database\Factories\ActivityLogFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $activity_log_ID
 * @property string $actor_type
 * @property int|null $actor_ID
 * @property string $actor_name
 * @property string|null $actor_email
 * @property string|null $actor_role
 * @property int|null $actor_branch_ID
 * @property string $action
 * @property string $context
 * @property string $subject_type
 * @property string|null $subject_ID
 * @property string|null $subject_label
 * @property string $description
 * @property array<string, mixed>|null $old_values
 * @property array<string, mixed>|null $new_values
 */
class ActivityLog extends Model
{
    /** @use HasFactory<ActivityLogFactory> */
    use HasFactory;

    protected $primaryKey = 'activity_log_ID';

    protected $fillable = [
        'actor_type',
        'actor_ID',
        'actor_name',
        'actor_email',
        'actor_role',
        'actor_branch_ID',
        'action',
        'context',
        'subject_type',
        'subject_ID',
        'subject_label',
        'description',
        'old_values',
        'new_values',
        'request_method',
        'route_name',
        'url',
        'ip_address',
        'user_agent',
    ];

    /** @return array<string, string> */
    public static function contextLabels(): array
    {
        return [
            'appointments' => 'Appointments',
            'branches' => 'Branches',
            'categories' => 'Categories',
            'distribution' => 'Distribution',
            'feedback' => 'Feedback',
            'inventory' => 'Inventory',
            'notifications' => 'Notifications',
            'patients' => 'Patients',
            'point_of_sale' => 'Point of Sale',
            'reports' => 'Reports',
            'services' => 'Services',
            'staff' => 'Staff',
            'system_settings' => 'System Settings',
            'general' => 'General',
        ];
    }

    /** @param Builder<ActivityLog> $query */
    public function scopeVisibleTo(Builder $query, StaffAccount|User $user): void
    {
        if ($user instanceof User || $user->isSuperAdmin()) {
            return;
        }

        if (! $user->isAdmin()) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(function (Builder $visibilityQuery) use ($user): void {
            $visibilityQuery
                ->where('actor_type', 'patient')
                ->orWhere(function (Builder $staffQuery) use ($user): void {
                    $staffQuery
                        ->where('actor_type', 'staff')
                        ->where('actor_branch_ID', $user->branch_ID)
                        ->where('actor_role', '!=', 'super_admin');
                })
                ->orWhere(function (Builder $systemQuery) use ($user): void {
                    $systemQuery
                        ->where('actor_type', 'system')
                        ->where('actor_branch_ID', $user->branch_ID);
                });
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }
}
