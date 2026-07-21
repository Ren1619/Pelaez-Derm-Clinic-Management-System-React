<?php

namespace App\Http\Requests;

use App\Models\Category;

class UpdateCategoryRequest extends CategoryRequest
{
    public function authorize(): bool
    {
        $category = $this->route('category');

        return $category instanceof Category
            && ($this->user()?->can('update', $category) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var Category $category */
        $category = $this->route('category');

        return $this->categoryRules($this->uniqueNameRule($category));
    }
}
