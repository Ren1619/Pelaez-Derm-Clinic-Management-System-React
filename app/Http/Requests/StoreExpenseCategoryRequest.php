<?php

namespace App\Http\Requests;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Expense::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'category_name' => ['required', 'string', 'max:100', Rule::unique((new ExpenseCategory)->getTable(), 'category_name')],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['category_name' => trim((string) $this->input('category_name'))]);
    }
}
