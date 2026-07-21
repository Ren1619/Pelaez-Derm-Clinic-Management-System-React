<?php

namespace App\Http\Requests;

use App\Models\Branch;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('createForBranch', [Sale::class, $this->integer('branch_ID')]) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'branch_ID' => ['required', 'integer', Rule::exists((new Branch)->getTable(), 'branch_ID')],
            'PID' => ['nullable', 'integer', Rule::exists((new Patient)->getTable(), 'PID')],
            'customer_name' => ['required', 'string', 'max:255'],
            'discount_percentage' => ['required', 'numeric', 'min:0', 'max:100', 'decimal:0,2'],
            'payment_method' => ['required', Rule::in(['cash', 'card', 'ewallet'])],
            'amount_received' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'products' => ['present', 'array', 'max:100'],
            'products.*.product_ID' => ['required', 'integer', 'distinct', Rule::exists((new Product)->getTable(), 'product_ID')],
            'products.*.quantity' => ['required', 'integer', 'min:1', 'max:999999'],
            'services' => ['present', 'array', 'max:100'],
            'services.*.service_ID' => ['required', 'integer', 'distinct', Rule::exists((new Service)->getTable(), 'service_ID')],
            'services.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'services.*.custom_price' => ['required', 'numeric', 'gt:0', 'max:9999999.99', 'decimal:0,2'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['customer_name' => trim((string) $this->input('customer_name'))]);
    }
}
