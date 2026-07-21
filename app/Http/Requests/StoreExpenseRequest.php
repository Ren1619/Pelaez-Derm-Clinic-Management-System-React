<?php

namespace App\Http\Requests;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('createForBranch', [Expense::class, $this->integer('branch_ID')]) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'branch_ID' => ['required', 'integer', Rule::exists((new Branch)->getTable(), 'branch_ID')],
            'category_ID' => ['required', 'integer', Rule::exists((new ExpenseCategory)->getTable(), 'category_ID')],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999.99', 'decimal:0,2'],
            'expense_date' => ['required', 'date', 'before_or_equal:today'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['description' => trim((string) $this->input('description'))]);
    }
}
