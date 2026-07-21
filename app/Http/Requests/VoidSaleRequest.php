<?php

namespace App\Http\Requests;

use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VoidSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $sale = $this->route('sale');

        return $sale instanceof Sale && ($this->user()?->can('update', $sale) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
            'refund_method' => ['required', Rule::in(['cash', 'card', 'ewallet', 'store_credit'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
