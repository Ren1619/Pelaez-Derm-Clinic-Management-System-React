<?php

namespace App\Models;

use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $product_ID
 * @property int $category_ID
 * @property int $branch_ID
 * @property string $name
 * @property string $measurement_unit
 * @property string $price
 * @property int $quantity
 * @property Carbon|null $expiration_date
 * @property string|null $product_img
 */
class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    protected $primaryKey = 'product_ID';

    protected $fillable = [
        'category_ID',
        'branch_ID',
        'name',
        'measurement_unit',
        'price',
        'quantity',
        'expiration_date',
        'product_img',
    ];

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_ID', 'category_ID');
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_ID', 'branch_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'quantity' => 'integer',
            'expiration_date' => 'date',
        ];
    }
}
