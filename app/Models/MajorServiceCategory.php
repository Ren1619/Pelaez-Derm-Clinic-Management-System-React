<?php

namespace App\Models;

use Database\Factories\MajorServiceCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MajorServiceCategory extends Model
{
    /** @use HasFactory<MajorServiceCategoryFactory> */
    use HasFactory;

    protected $primaryKey = 'major_service_category_ID';

    protected $fillable = [
        'name',
        'description',
    ];

    /** @return HasMany<Category, $this> */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class, 'major_service_category_ID', 'major_service_category_ID');
    }
}
