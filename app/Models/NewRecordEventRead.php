<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $new_record_event_id
 * @property string $viewer_type
 * @property int $viewer_id
 * @property Carbon $seen_at
 */
class NewRecordEventRead extends Model
{
    protected $fillable = [
        'new_record_event_id',
        'viewer_type',
        'viewer_id',
        'seen_at',
    ];

    /** @return BelongsTo<NewRecordEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(NewRecordEvent::class, 'new_record_event_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['seen_at' => 'datetime'];
    }
}
