<?php

namespace App\Http\Requests;

use App\Models\Category;

class StoreCategoryRequest extends CategoryRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Category::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return $this->categoryRules($this->uniqueNameRule());
    }
}
