<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $category_ID
 * @property string $category_name
 */
class ExpenseCategory extends Model
{
    /** @use HasFactory<\Database\Factories\ExpenseCategoryFactory> */
    use HasFactory;

    protected $primaryKey = 'category_ID';
    protected $fillable = ['category_name'];
    /** @return HasMany<Expense, $this> */
    public function expenses(): HasMany { return $this->hasMany(Expense::class, 'category_ID', 'category_ID'); }
}
