<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $system_notification_id
 * @property string $viewer_type
 * @property int $viewer_id
 * @property Carbon $seen_at
 */
class SystemNotificationRead extends Model
{
    protected $fillable = [
        'system_notification_id',
        'viewer_type',
        'viewer_id',
        'seen_at',
    ];

    /** @return BelongsTo<SystemNotification, $this> */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(SystemNotification::class, 'system_notification_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['seen_at' => 'datetime'];
    }
}
