<?php

namespace App\Models;

use Database\Factories\DistributionItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DistributionItem extends Model
{
    /** @use HasFactory<DistributionItemFactory> */
    use HasFactory;

    protected $primaryKey = 'distribution_item_ID';

    protected $fillable = [
        'distribution_ID', 'product_ID', 'category_ID', 'product_name', 'category_name',
        'measurement_unit', 'quantity', 'price', 'expiration_date', 'product_img',
    ];

    /** @return BelongsTo<Distribution, $this> */
    public function distribution(): BelongsTo
    {
        return $this->belongsTo(Distribution::class, 'distribution_ID', 'distribution_ID');
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_ID', 'product_ID');
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_ID', 'category_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['quantity' => 'integer', 'price' => 'decimal:2', 'expiration_date' => 'date'];
    }
}
