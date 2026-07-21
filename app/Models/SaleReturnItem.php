<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $return_item_ID
 * @property int $return_ID
 * @property string $item_type
 * @property int $sale_item_ID
 * @property string $item_name
 * @property int $quantity_returned
 * @property string $item_price
 * @property string $subtotal
 * @property bool $restocked
 */
class SaleReturnItem extends Model
{
    /** @use HasFactory<\Database\Factories\SaleReturnItemFactory> */
    use HasFactory;

    protected $primaryKey = 'return_item_ID';
    protected $fillable = ['return_ID', 'item_type', 'sale_item_ID', 'item_name', 'quantity_returned', 'item_price', 'subtotal', 'restocked'];
    /** @return BelongsTo<SaleReturn, $this> */
    public function saleReturn(): BelongsTo { return $this->belongsTo(SaleReturn::class, 'return_ID', 'return_ID'); }
    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['quantity_returned' => 'integer', 'item_price' => 'decimal:2', 'subtotal' => 'decimal:2', 'restocked' => 'boolean'];
    }
}
