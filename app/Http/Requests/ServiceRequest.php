<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Models\Service;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\Validator;

abstract class ServiceRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    protected function serviceRules(Unique $serviceNameRule): array
    {
        return [
            'category_ID' => [
                'required',
                'integer',
                Rule::exists((new Category)->getTable(), 'category_ID')
                    ->where(fn (Builder $query): Builder => $query->where('category_type', 'Service')),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                "regex:/^[\\pL\\pN\\s\\-\\/&'()\\[\\]%]+$/u",
                $serviceNameRule,
            ],
            'description' => ['required', 'string', 'max:1000'],
            'new_image' => [
                'nullable',
                File::types(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])->max(20 * 1024),
            ],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['name', 'category_ID'])) {
                    return;
                }

                $service = $this->route('service');
                $duplicateQuery = Service::query()
                    ->whereRaw('LOWER(TRIM(name)) = ?', [Str::lower($this->string('name')->trim()->toString())])
                    ->where('category_ID', $this->integer('category_ID'));

                if ($service instanceof Service) {
                    $duplicateQuery->whereKeyNot($service->getKey());
                }

                if ($duplicateQuery->exists()) {
                    $validator->errors()->add(
                        'name',
                        'A service with this name already exists in the selected category.',
                    );
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'category_ID.exists' => 'Select a valid service category.',
            'name.regex' => "The service name may only contain letters, numbers, spaces, and / - & ' ( ) [ ] % symbols.",
            'name.unique' => 'A service with this name already exists in the selected category.',
            'description.required' => 'The description cannot be empty or contain only whitespace.',
            'new_image.mimes' => 'The image must be a JPEG, PNG, WebP, HEIC, or HEIF file.',
            'new_image.max' => 'The image must not be larger than 20 MB.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => Str::of($this->input('name', ''))->squish()->toString(),
            'description' => Str::of($this->input('description', ''))->trim()->toString(),
        ]);
    }

    protected function uniqueNameRule(?Service $service = null): Unique
    {
        $rule = Rule::unique((new Service)->getTable(), 'name')
            ->where(fn (Builder $query): Builder => $query->where(
                'category_ID',
                $this->integer('category_ID'),
            ));

        return $service === null ? $rule : $rule->ignore($service);
    }
}
