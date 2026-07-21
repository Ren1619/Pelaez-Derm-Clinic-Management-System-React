<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $return_ID
 * @property int $sale_ID
 * @property string $return_type
 * @property string $return_amount
 * @property string $return_reason
 * @property string $refund_method
 * @property int|null $processed_by
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property-read StaffAccount|null $processedBy
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SaleReturnItem> $items
 */
class SaleReturn extends Model
{
    /** @use HasFactory<\Database\Factories\SaleReturnFactory> */
    use HasFactory;

    protected $primaryKey = 'return_ID';
    protected $fillable = ['sale_ID', 'return_type', 'return_amount', 'return_reason', 'refund_method', 'processed_by', 'notes'];
    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo { return $this->belongsTo(Sale::class, 'sale_ID', 'sale_ID'); }
    /** @return BelongsTo<StaffAccount, $this> */
    public function processedBy(): BelongsTo { return $this->belongsTo(StaffAccount::class, 'processed_by', 'account_ID'); }
    /** @return HasMany<SaleReturnItem, $this> */
    public function items(): HasMany { return $this->hasMany(SaleReturnItem::class, 'return_ID', 'return_ID'); }
    /** @return array<string, string> */
    protected function casts(): array { return ['return_amount' => 'decimal:2']; }
}
