<?php

namespace App\Http\Requests;

use App\Models\MajorServiceCategory;

class UpdateMajorServiceCategoryRequest extends MajorServiceCategoryRequest
{
    public function authorize(): bool
    {
        $majorServiceCategory = $this->route('major_service_category');

        return $majorServiceCategory instanceof MajorServiceCategory
            && ($this->user()?->can('update', $majorServiceCategory) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var MajorServiceCategory $majorServiceCategory */
        $majorServiceCategory = $this->route('major_service_category');

        return $this->majorServiceCategoryRules($this->uniqueNameRule($majorServiceCategory));
    }
}
