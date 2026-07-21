<?php

namespace App\Http\Requests;

use App\Models\Branch;
use App\Models\Distribution;
use App\Models\Product;
use App\Models\StaffAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDistributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Distribution::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'from_branch_ID' => ['required', 'integer', Rule::exists((new Branch)->getTable(), 'branch_ID')],
            'to_branch_ID' => [
                'required', 'integer', 'different:from_branch_ID',
                Rule::exists((new Branch)->getTable(), 'branch_ID'),
            ],
            'scheduled_date' => ['nullable', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.product_ID' => [
                'required', 'integer', 'distinct:strict',
                Rule::exists((new Product)->getTable(), 'product_ID'),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999999'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $products = Product::query()
                ->whereIn('product_ID', collect($this->input('items'))->pluck('product_ID'))
                ->get()
                ->keyBy('product_ID');

            foreach ($this->input('items') as $index => $item) {
                $product = $products->get((int) $item['product_ID']);

                if ($product?->branch_ID !== $this->integer('from_branch_ID')) {
                    $validator->errors()->add("items.{$index}.product_ID", 'The product must belong to the source branch.');
                } elseif ($product->quantity < (int) $item['quantity']) {
                    $validator->errors()->add("items.{$index}.quantity", 'The requested quantity exceeds current stock.');
                }
            }
        }];
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();

        if ($user instanceof StaffAccount && ! $user->isSuperAdmin()) {
            $this->merge(['from_branch_ID' => $user->branch_ID]);
        }
    }
}
