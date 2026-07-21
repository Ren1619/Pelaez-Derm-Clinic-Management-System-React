<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $sale_service_item_ID
 * @property int $sale_ID
 * @property int|null $service_ID
 * @property string $service_name
 * @property int $quantity
 * @property string $custom_price
 * @property string $line_total
 */
class SaleServiceItem extends Model
{
    /** @use HasFactory<\Database\Factories\SaleServiceItemFactory> */
    use HasFactory;

    protected $primaryKey = 'sale_service_item_ID';
    protected $fillable = ['sale_ID', 'service_ID', 'service_name', 'quantity', 'custom_price', 'line_total'];
    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo { return $this->belongsTo(Sale::class, 'sale_ID', 'sale_ID'); }
    /** @return BelongsTo<Service, $this> */
    public function service(): BelongsTo { return $this->belongsTo(Service::class, 'service_ID', 'service_ID'); }
    /** @return array<string, string> */
    protected function casts(): array { return ['quantity' => 'integer', 'custom_price' => 'decimal:2', 'line_total' => 'decimal:2']; }
}
