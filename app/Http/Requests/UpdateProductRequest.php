<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends ProductRequest
{
    public function authorize(): bool
    {
        $product = $this->product();

        return $product !== null
            && ($this->user()?->can('update', $product) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => $this->nameRules(),
            'category_ID' => $this->categoryRules(),
            'measurement_unit' => $this->measurementUnitRules(),
            'quantity' => $this->quantityRules(),
            'price' => $this->priceRules(),
            'new_image' => $this->imageRules(),
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

                $product = $this->product();

                if ($product === null) {
                    return;
                }

                $duplicateExists = Product::query()
                    ->whereRaw('LOWER(TRIM(name)) = ?', [Str::lower($this->string('name')->trim()->toString())])
                    ->where('branch_ID', $product->branch_ID)
                    ->whereDate('expiration_date', $product->expiration_date)
                    ->whereKeyNot($product->getKey())
                    ->exists();

                if ($duplicateExists) {
                    $validator->errors()->add(
                        'name',
                        'A batch with this product name and expiration date already exists at the branch.',
                    );
                }
            },
        ];
    }
}
