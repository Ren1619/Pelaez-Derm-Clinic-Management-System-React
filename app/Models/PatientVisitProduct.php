<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientVisitProduct extends Model
{
    /** @use HasFactory<\Database\Factories\PatientVisitProductFactory> */
    use HasFactory;

    protected $primaryKey = 'visit_product_ID';

    protected $fillable = ['visit_ID', 'product_ID', 'product_name', 'quantity', 'unit_price', 'note'];

    /** @return BelongsTo<PatientVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class, 'visit_ID', 'visit_ID');
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_ID', 'product_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['quantity' => 'integer', 'unit_price' => 'decimal:2'];
    }
}
