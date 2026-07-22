<?php

namespace App\Models;

use Database\Factories\SystemNotificationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $sender_id
 * @property string $sender_type
 * @property int|null $receiver_id
 * @property string $receiver_type
 * @property int|null $branch_id
 * @property int|null $appointment_id
 * @property string $type
 * @property string|null $deduplication_key
 * @property string $title
 * @property string $message
 * @property string|null $reason
 * @property bool $is_read
 * @property array<string, mixed>|null $data
 * @property Carbon|null $created_at
 */
class SystemNotification extends Model
{
    /** @use HasFactory<SystemNotificationFactory> */
    use HasFactory;

    protected $fillable = [
        'sender_id', 'sender_type', 'receiver_id', 'receiver_type', 'branch_id',
        'appointment_id', 'type', 'deduplication_key', 'title', 'message', 'reason', 'is_read', 'data',
    ];

    /** @return BelongsTo<Appointment, $this> */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_ID');
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_ID');
    }

    /** @return HasMany<SystemNotificationRead, $this> */
    public function reads(): HasMany
    {
        return $this->hasMany(SystemNotificationRead::class, 'system_notification_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_read' => 'boolean', 'data' => 'array'];
    }
}
