<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $sale_ID
 * @property string $invoice_number
 * @property int|null $branch_ID
 * @property string $branch_name
 * @property int|null $PID
 * @property int|null $processed_by
 * @property string $customer_name
 * @property Carbon $date
 * @property string $subtotal_cost
 * @property string $discount_perc
 * @property string $discount_amount
 * @property string $total_cost
 * @property string $pay_method
 * @property string|null $amount_received
 * @property string|null $change_amount
 * @property bool $finalized
 * @property bool $is_voided
 * @property Carbon|null $voided_at
 * @property int|null $voided_by
 * @property string|null $void_reason
 * @property Carbon|null $created_at
 * @property-read StaffAccount|null $processedBy
 * @property-read StaffAccount|null $voidedBy
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SaleProductItem> $productItems
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SaleServiceItem> $serviceItems
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SaleReturn> $returns
 */
class Sale extends Model
{
    /** @use HasFactory<\Database\Factories\SaleFactory> */
    use HasFactory;

    protected $primaryKey = 'sale_ID';

    protected $fillable = [
        'invoice_number', 'branch_ID', 'branch_name', 'PID', 'processed_by', 'customer_name', 'date',
        'subtotal_cost', 'discount_perc', 'discount_amount', 'total_cost', 'pay_method', 'amount_received',
        'change_amount', 'finalized', 'is_voided', 'voided_at', 'voided_by', 'void_reason',
    ];

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class, 'branch_ID', 'branch_ID'); }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo { return $this->belongsTo(Patient::class, 'PID', 'PID'); }

    /** @return BelongsTo<StaffAccount, $this> */
    public function processedBy(): BelongsTo { return $this->belongsTo(StaffAccount::class, 'processed_by', 'account_ID'); }

    /** @return BelongsTo<StaffAccount, $this> */
    public function voidedBy(): BelongsTo { return $this->belongsTo(StaffAccount::class, 'voided_by', 'account_ID'); }

    /** @return HasMany<SaleProductItem, $this> */
    public function productItems(): HasMany { return $this->hasMany(SaleProductItem::class, 'sale_ID', 'sale_ID'); }

    /** @return HasMany<SaleServiceItem, $this> */
    public function serviceItems(): HasMany { return $this->hasMany(SaleServiceItem::class, 'sale_ID', 'sale_ID'); }

    /** @return HasMany<SaleReturn, $this> */
    public function returns(): HasMany { return $this->hasMany(SaleReturn::class, 'sale_ID', 'sale_ID'); }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'date' => 'date', 'subtotal_cost' => 'decimal:2', 'discount_perc' => 'decimal:2',
            'discount_amount' => 'decimal:2', 'total_cost' => 'decimal:2', 'amount_received' => 'decimal:2',
            'change_amount' => 'decimal:2', 'finalized' => 'boolean', 'is_voided' => 'boolean', 'voided_at' => 'datetime',
        ];
    }
}
