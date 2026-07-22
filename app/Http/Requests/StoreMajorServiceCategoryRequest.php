<?php

namespace App\Http\Requests;

use App\Models\MajorServiceCategory;

class StoreMajorServiceCategoryRequest extends MajorServiceCategoryRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', MajorServiceCategory::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return $this->majorServiceCategoryRules($this->uniqueNameRule());
    }
}
