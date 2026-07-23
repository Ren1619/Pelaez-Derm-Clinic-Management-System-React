<?php

namespace App\Services\POS;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleProductItem;
use App\Models\SaleServiceItem;
use App\Models\Service;
use Illuminate\Support\Facades\Storage;

class PointOfSalePageService
{
    /** @return array<string, mixed> */
    public function payload(int $branchId, string $salesDate, int $expenseMonth, int $expenseYear, bool $canViewAllBranches = true): array
    {
        $branches = Branch::query()
            ->when(! $canViewAllBranches, fn ($query) => $query->whereKey($branchId))
            ->orderBy('branch_name')
            ->get(['branch_ID', 'branch_name']);
        $sales = Sale::query()
            ->where('branch_ID', $branchId)
            ->whereDate('date', $salesDate)
            ->where('finalized', true)
            ->with([
                'productItems', 'serviceItems', 'returns.items',
                'returns.processedBy:account_ID,first_name,middle_name,last_name',
                'voidedBy:account_ID,first_name,middle_name,last_name',
                'processedBy:account_ID,first_name,middle_name,last_name',
            ])
            ->latest('created_at')
            ->limit(50)
            ->get();
        $expenses = Expense::query()
            ->where('branch_ID', $branchId)
            ->whereYear('expense_date', $expenseYear)
            ->whereMonth('expense_date', $expenseMonth)
            ->with('account:account_ID,first_name,middle_name,last_name')
            ->latest('expense_date')
            ->latest('created_at')
            ->get();

        return [
            'branches' => $branches,
            'products' => $this->products($branchId),
            'services' => $this->services(),
            'patients' => $this->patients(),
            'dailySales' => $sales->map(fn (Sale $sale): array => $this->serializeSale($sale))->all(),
            'dailySummary' => [
                'gross' => round((float) $sales->where('is_voided', false)->sum('total_cost'), 2),
                'voided' => round((float) $sales->where('is_voided', true)->sum('total_cost'), 2),
                'returned' => round((float) $sales->where('is_voided', false)->sum(fn (Sale $sale): float => (float) $sale->returns->sum('return_amount')), 2),
                'net' => round((float) $sales->where('is_voided', false)->sum(fn (Sale $sale): float => (float) $sale->total_cost - (float) $sale->returns->sum('return_amount')), 2),
            ],
            'expenseCategories' => ExpenseCategory::query()->orderBy('category_name')->get(['category_ID', 'category_name']),
            'expenses' => $expenses->map(fn (Expense $expense): array => [
                ...app(\App\Services\NewRecordService::class)->metadata($expense),
                'expense_ID' => $expense->expense_ID,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'category' => $expense->category_name,
                'branch' => $expense->branch_name,
                'created_by' => $expense->account?->full_name ?? 'Former user',
                'expense_date' => $expense->expense_date->toDateString(),
                'created_at' => $expense->created_at?->toISOString(),
            ])->all(),
            'expenseSummary' => ['total' => round((float) $expenses->sum('amount'), 2), 'count' => $expenses->count()],
            'filters' => [
                'branch_ID' => $branchId,
                'sales_date' => $salesDate,
                'expense_month' => $expenseMonth,
                'expense_year' => $expenseYear,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function receipt(Sale $sale): array
    {
        $sale->loadMissing([
            'productItems',
            'serviceItems',
            'returns.items',
            'processedBy:account_ID,first_name,middle_name,last_name',
            'patient:PID,first_name,middle_name,last_name',
        ]);

        return $this->serializeSale($sale);
    }

    /** @return array<string, mixed> */
    public function serializeSale(Sale $sale): array
    {
        $returnedQuantities = $sale->returns->flatMap->items
            ->groupBy(fn ($item): string => $item->item_type.'|'.$item->sale_item_ID)
            ->map->sum('quantity_returned');
        $productItems = $sale->productItems->map(function (SaleProductItem $item) use ($returnedQuantities): array {
            $returned = (int) $returnedQuantities->get('product|'.$item->sale_product_item_ID, 0);

            return [
                'item_ID' => $item->sale_product_item_ID,
                'type' => 'product',
                'name' => $item->product_name,
                'measurement_unit' => $item->measurement_unit,
                'quantity' => $item->quantity,
                'returned_quantity' => $returned,
                'returnable_quantity' => max(0, $item->quantity - $returned),
                'price' => $item->unit_price,
                'subtotal' => $item->line_total,
            ];
        });
        $serviceItems = $sale->serviceItems->map(function (SaleServiceItem $item) use ($returnedQuantities): array {
            $returned = (int) $returnedQuantities->get('service|'.$item->sale_service_item_ID, 0);

            return [
                'item_ID' => $item->sale_service_item_ID,
                'type' => 'service',
                'name' => $item->service_name,
                'measurement_unit' => null,
                'quantity' => $item->quantity,
                'returned_quantity' => $returned,
                'returnable_quantity' => max(0, $item->quantity - $returned),
                'price' => $item->custom_price,
                'subtotal' => $item->line_total,
            ];
        });
        $returnedAmount = (float) $sale->returns->sum('return_amount');

        return [
            ...app(\App\Services\NewRecordService::class)->metadata($sale),
            'sale_ID' => $sale->sale_ID,
            'invoice_number' => $sale->invoice_number,
            'branch_ID' => $sale->branch_ID,
            'branch_name' => $sale->branch_name,
            'PID' => $sale->PID,
            'customer_name' => $sale->customer_name,
            'date' => $sale->date->toDateString(),
            'created_at' => $sale->created_at?->toISOString(),
            'processed_by' => $sale->processedBy?->full_name ?? 'Former user',
            'subtotal_cost' => $sale->subtotal_cost,
            'discount_perc' => $sale->discount_perc,
            'discount_amount' => $sale->discount_amount,
            'total_cost' => $sale->total_cost,
            'pay_method' => $sale->pay_method,
            'amount_received' => $sale->amount_received,
            'change_amount' => $sale->change_amount,
            'total_items' => $sale->productItems->sum('quantity') + $sale->serviceItems->sum('quantity'),
            'is_voided' => $sale->is_voided,
            'void_reason' => $sale->void_reason,
            'voided_at' => $sale->voided_at?->toISOString(),
            'voided_by' => $sale->voidedBy?->full_name,
            'total_returned' => number_format($returnedAmount, 2, '.', ''),
            'net_total' => number_format($sale->is_voided ? 0 : max(0, (float) $sale->total_cost - $returnedAmount), 2, '.', ''),
            'items' => $productItems->concat($serviceItems)->values()->all(),
            'returns' => $sale->returns->sortByDesc('created_at')->values()->map(fn ($return): array => [
                'return_ID' => $return->return_ID,
                'return_type' => $return->return_type,
                'return_amount' => $return->return_amount,
                'return_reason' => $return->return_reason,
                'refund_method' => $return->refund_method,
                'processed_by' => $return->processedBy?->full_name ?? 'Former user',
                'notes' => $return->notes,
                'created_at' => $return->created_at?->toISOString(),
            ])->all(),
            'can_return' => ! $sale->is_voided && $sale->created_at?->gte(now()->subDays(30)) === true
                && $returnedAmount < (float) $sale->total_cost,
            'can_void' => ! $sale->is_voided && $sale->returns->isEmpty()
                && $sale->created_at?->gte(now()->subDays(30)) === true,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function products(int $branchId): array
    {
        return Product::query()
            ->where('branch_ID', $branchId)
            ->where('quantity', '>', 0)
            ->whereDate('expiration_date', '>=', today())
            ->with('category:category_ID,category_name')
            ->orderBy('name')
            ->orderBy('expiration_date')
            ->get()
            ->groupBy(fn (Product $product): string => mb_strtolower(trim($product->name)).'|'.$product->branch_ID)
            ->map(function ($batches): array {
                /** @var Product $primary */
                $primary = $batches->first();
                $quantity = (int) $batches->sum('quantity');

                return [
                    'product_ID' => $primary->product_ID,
                    'name' => $primary->name,
                    'category' => $primary->category?->category_name,
                    'measurement_unit' => $primary->measurement_unit,
                    'price' => $primary->price,
                    'quantity' => $quantity,
                    'status' => $quantity <= 20 ? 'low stock' : 'in stock',
                    'expiration_date' => $primary->expiration_date?->toDateString(),
                    'image_url' => $this->imageUrl($primary->product_img),
                ];
            })->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function services(): array
    {
        return Service::query()
            ->with('category:category_ID,category_name')
            ->orderByRaw("CASE WHEN LOWER(name) LIKE '%consultation%' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(fn (Service $service): array => [
                'service_ID' => $service->service_ID,
                'name' => $service->name,
                'description' => $service->description,
                'category' => $service->category?->category_name,
                'image_url' => $this->imageUrl($service->service_img),
            ])->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function patients(): array
    {
        return Patient::query()
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(500)
            ->get(['PID', 'first_name', 'middle_name', 'last_name', 'contact_number'])
            ->map(fn (Patient $patient): array => [
                'PID' => $patient->PID,
                'full_name' => $patient->full_name,
                'contact_number' => $patient->contact_number,
            ])->all();
    }

    private function imageUrl(?string $path): ?string
    {
        return $path === null ? null : Storage::disk('public')->url($path);
    }
}
