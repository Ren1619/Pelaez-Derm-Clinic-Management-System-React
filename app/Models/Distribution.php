<?php

namespace App\Models;

use Database\Factories\DistributionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $distribution_ID
 * @property int $from_branch_ID
 * @property int $to_branch_ID
 * @property int|null $created_by
 * @property string $status
 * @property Carbon|null $scheduled_date
 * @property Carbon|null $sent_date
 * @property Carbon|null $received_date
 * @property string|null $notes
 * @property string|null $cancellation_reason
 */

class Distribution extends Model
{
    /** @use HasFactory<DistributionFactory> */
    use HasFactory;

    public const Pending = 'pending';
    public const InTransit = 'in_transit';
    public const Delivered = 'delivered';
    public const Cancelled = 'cancelled';

    protected $primaryKey = 'distribution_ID';

    protected $fillable = [
        'from_branch_ID', 'to_branch_ID', 'created_by', 'status', 'scheduled_date',
        'sent_date', 'received_date', 'notes', 'cancellation_reason',
    ];

    /** @return BelongsTo<Branch, $this> */
    public function fromBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'from_branch_ID', 'branch_ID');
    }

    /** @return BelongsTo<Branch, $this> */
    public function toBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'to_branch_ID', 'branch_ID');
    }

    /** @return BelongsTo<StaffAccount, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(StaffAccount::class, 'created_by', 'account_ID');
    }

    /** @return HasMany<DistributionItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(DistributionItem::class, 'distribution_ID', 'distribution_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['scheduled_date' => 'datetime', 'sent_date' => 'datetime', 'received_date' => 'datetime'];
    }
}
