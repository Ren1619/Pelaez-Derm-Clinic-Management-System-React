<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

abstract class ProductRequest extends FormRequest
{
    /** @return array<int, mixed> */
    protected function nameRules(): array
    {
        return [
            'required',
            'string',
            'max:255',
            "regex:/^[\\pL\\pN\\s\\-\\/&'()\\[\\]%]+$/u",
        ];
    }

    /** @return array<int, mixed> */
    protected function categoryRules(): array
    {
        return [
            'required',
            'integer',
            Rule::exists((new Category)->getTable(), 'category_ID')
                ->where(fn (Builder $query): Builder => $query->where('category_type', 'Product')),
        ];
    }

    /** @return array<int, mixed> */
    protected function measurementUnitRules(): array
    {
        return ['required', 'string', 'max:50', 'regex:/^[\pL\pN\s]+$/u'];
    }

    /** @return array<int, mixed> */
    protected function quantityRules(int $minimum = 0): array
    {
        return ['required', 'integer', "min:{$minimum}", 'max:999999'];
    }

    /** @return array<int, mixed> */
    protected function priceRules(): array
    {
        return ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:999999.99'];
    }

    /** @return array<int, mixed> */
    protected function expirationDateRules(): array
    {
        return ['required', Rule::date()->afterToday()];
    }

    /** @return array<int, mixed> */
    protected function imageRules(): array
    {
        return [
            'nullable',
            File::types(['jpg', 'jpeg', 'png'])->max(20 * 1024),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.regex' => "The product name may only contain letters, numbers, spaces, and / - & ' ( ) [ ] % symbols.",
            'category_ID.exists' => 'Select a valid product category.',
            'measurement_unit.regex' => 'The measurement unit may only contain letters, numbers, and spaces.',
            'quantity.min' => 'The quantity must be at least :min.',
            'expiration_date.after' => 'The expiration date must be in the future.',
            'new_image.mimes' => 'The image must be a JPEG or PNG file.',
            'new_image.max' => 'The image must not be larger than 20 MB.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];

        if ($this->has('name')) {
            $normalized['name'] = Str::of($this->input('name', ''))->squish()->toString();
        }

        if ($this->has('measurement_unit')) {
            $normalized['measurement_unit'] = Str::of($this->input('measurement_unit', ''))->squish()->toString();
        }

        $this->merge($normalized);
    }

    protected function product(): ?Product
    {
        $product = $this->route('product');

        return $product instanceof Product ? $product : null;
    }
}
