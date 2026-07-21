<?php

namespace App\Http\Requests;

class RestockProductRequest extends ProductRequest
{
    public function authorize(): bool
    {
        $product = $this->product();

        return $product !== null
            && $product->branch_ID === 1
            && ($this->user()?->can('update', $product) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'quantity' => $this->quantityRules(1),
            'price' => $this->priceRules(),
            'expiration_date' => $this->expirationDateRules(),
            'new_image' => $this->imageRules(),
        ];
    }
}
