<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $sale_product_item_ID
 * @property int $sale_ID
 * @property int|null $product_ID
 * @property string $product_name
 * @property string|null $measurement_unit
 * @property int $quantity
 * @property string $unit_price
 * @property string $line_total
 */
class SaleProductItem extends Model
{
    /** @use HasFactory<\Database\Factories\SaleProductItemFactory> */
    use HasFactory;

    protected $primaryKey = 'sale_product_item_ID';
    protected $fillable = ['sale_ID', 'product_ID', 'product_name', 'measurement_unit', 'quantity', 'unit_price', 'line_total'];

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo { return $this->belongsTo(Sale::class, 'sale_ID', 'sale_ID'); }
    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo { return $this->belongsTo(Product::class, 'product_ID', 'product_ID'); }
    /** @return array<string, string> */
    protected function casts(): array { return ['quantity' => 'integer', 'unit_price' => 'decimal:2', 'line_total' => 'decimal:2']; }
}
