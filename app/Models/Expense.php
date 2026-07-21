<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $expense_ID
 * @property int|null $branch_ID
 * @property string $branch_name
 * @property int|null $category_ID
 * @property string $category_name
 * @property int|null $account_ID
 * @property string $description
 * @property string $amount
 * @property Carbon $expense_date
 * @property Carbon|null $created_at
 * @property-read StaffAccount|null $account
 */
class Expense extends Model
{
    /** @use HasFactory<\Database\Factories\ExpenseFactory> */
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'expense_ID';
    protected $fillable = ['branch_ID', 'branch_name', 'category_ID', 'category_name', 'account_ID', 'description', 'amount', 'expense_date'];
    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class, 'branch_ID', 'branch_ID'); }
    /** @return BelongsTo<ExpenseCategory, $this> */
    public function category(): BelongsTo { return $this->belongsTo(ExpenseCategory::class, 'category_ID', 'category_ID'); }
    /** @return BelongsTo<StaffAccount, $this> */
    public function account(): BelongsTo { return $this->belongsTo(StaffAccount::class, 'account_ID', 'account_ID'); }
    /** @return array<string, string> */
    protected function casts(): array { return ['amount' => 'decimal:2', 'expense_date' => 'date']; }
}
