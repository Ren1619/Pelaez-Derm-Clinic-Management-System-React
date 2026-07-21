<?php

namespace App\Http\Requests;

use App\Models\Branch;
use App\Models\Product;
use Illuminate\Validation\Rule;

class StoreProductRequest extends ProductRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('createForBranch', [Product::class, $this->integer('branch_ID')]) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => $this->nameRules(),
            'category_ID' => $this->categoryRules(),
            'branch_ID' => [
                'required',
                'integer',
                Rule::exists((new Branch)->getTable(), 'branch_ID'),
                Rule::in([1]),
            ],
            'measurement_unit' => $this->measurementUnitRules(),
            'quantity' => $this->quantityRules(),
            'price' => $this->priceRules(),
            'expiration_date' => $this->expirationDateRules(),
            'new_image' => $this->imageRules(),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            ...parent::messages(),
            'branch_ID.in' => 'Products can only be added to the main branch.',
        ];
    }
}
