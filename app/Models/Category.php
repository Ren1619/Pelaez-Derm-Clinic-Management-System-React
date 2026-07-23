<?php

namespace App\Models;

use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory;

    protected $primaryKey = 'category_ID';

    protected $fillable = [
        'category_name',
        'category_type',
        'major_service_category_ID',
        'description',
    ];

    /** @return BelongsTo<MajorServiceCategory, $this> */
    public function majorServiceCategory(): BelongsTo
    {
        return $this->belongsTo(
            MajorServiceCategory::class,
            'major_service_category_ID',
            'major_service_category_ID',
        );
    }

    /** @return HasMany<Service, $this> */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'category_ID', 'category_ID');
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_ID', 'category_ID');
    }
}
