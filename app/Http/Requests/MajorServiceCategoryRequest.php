<?php

namespace App\Http\Requests;

use App\Models\MajorServiceCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\Validator;

abstract class MajorServiceCategoryRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    protected function majorServiceCategoryRules(Unique $nameRule): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                "regex:/^[\\pL\\pN\\s\\-\\/&'()\\[\\]%]+$/u",
                $nameRule,
            ],
            'description' => ['required', 'string', 'max:1000'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('name')) {
                    return;
                }

                $majorServiceCategory = $this->route('major_service_category');
                $duplicateQuery = MajorServiceCategory::query()
                    ->whereRaw('LOWER(TRIM(name)) = ?', [Str::lower($this->string('name')->trim()->toString())]);

                if ($majorServiceCategory instanceof MajorServiceCategory) {
                    $duplicateQuery->whereKeyNot($majorServiceCategory->getKey());
                }

                if ($duplicateQuery->exists()) {
                    $validator->errors()->add('name', 'A major service category already uses that name.');
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.regex' => "The name may only contain letters, numbers, spaces, and / - & ' ( ) [ ] % symbols.",
            'name.unique' => 'A major service category already uses that name.',
            'description.required' => 'The description cannot be empty or contain only whitespace.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => Str::of($this->input('name', ''))->squish()->toString(),
            'description' => Str::of($this->input('description', ''))->trim()->toString(),
        ]);
    }

    protected function uniqueNameRule(?MajorServiceCategory $majorServiceCategory = null): Unique
    {
        $rule = Rule::unique((new MajorServiceCategory)->getTable(), 'name');

        return $majorServiceCategory === null ? $rule : $rule->ignore($majorServiceCategory);
    }
}
