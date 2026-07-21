<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\Validator;

abstract class CategoryRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    protected function categoryRules(Unique $categoryNameRule): array
    {
        return [
            'category_name' => [
                'required',
                'string',
                'max:255',
                "regex:/^[\\pL\\pN\\s\\-\\/&'()\\[\\]%]+$/u",
                $categoryNameRule,
            ],
            'category_type' => ['required', 'string', Rule::in(['Product', 'Service'])],
            'description' => ['required', 'string', 'max:1000'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['category_name', 'category_type'])) {
                    return;
                }

                $category = $this->route('category');
                $duplicateQuery = Category::query()
                    ->whereRaw('LOWER(TRIM(category_name)) = ?', [Str::lower($this->string('category_name')->trim()->toString())])
                    ->where('category_type', $this->string('category_type')->toString());

                if ($category instanceof Category) {
                    $duplicateQuery->whereKeyNot($category->getKey());
                }

                $duplicateExists = $duplicateQuery->exists();

                if ($duplicateExists) {
                    $validator->errors()->add(
                        'category_name',
                        'A category of this type already uses that name.',
                    );
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'category_name.regex' => "The category name may only contain letters, numbers, spaces, and / - & ' ( ) [ ] % symbols.",
            'category_name.unique' => 'A category of this type already uses that name.',
            'category_type.in' => 'The category type must be Product or Service.',
            'description.required' => 'The description cannot be empty or contain only whitespace.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $categoryType = Str::of($this->input('category_type', ''))->trim()->lower()->ucfirst()->toString();

        $this->merge([
            'category_name' => Str::of($this->input('category_name', ''))->squish()->toString(),
            'category_type' => $categoryType,
            'description' => Str::of($this->input('description', ''))->trim()->toString(),
        ]);
    }

    protected function uniqueNameRule(?Category $category = null): Unique
    {
        $rule = Rule::unique((new Category)->getTable(), 'category_name')
            ->where(fn (Builder $query): Builder => $query->where(
                'category_type',
                $this->string('category_type')->toString(),
            ));

        return $category === null ? $rule : $rule->ignore($category);
    }
}
