<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\MajorServiceCategory;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PosSeeder extends Seeder
{
    public function run(): void
    {
        $expenseCategories = collect(['Clinic Supplies', 'Utilities', 'Transportation', 'Maintenance'])
            ->mapWithKeys(fn (string $name): array => [
                $name => ExpenseCategory::query()->firstOrCreate(['category_name' => $name]),
            ]);
        $branches = Branch::query()->orderBy('branch_ID')->get();
        $patients = Patient::query()->where('email', 'like', '%@pelaez.test')->orderBy('PID')->get();
        $processors = StaffAccount::query()
            ->whereHas('role', fn ($query) => $query->where('role_name', 'staff'))
            ->get()
            ->keyBy('branch_ID');
        $parentCategories = MajorServiceCategory::query()->orderBy('major_service_category_ID')->get();
        $products = Product::query()->orderBy('product_ID')->get();
        $servicesByParentCategory = Service::query()
            ->with('category')
            ->get()
            ->groupBy(fn (Service $service): int => $service->category->major_service_category_ID);

        if ($branches->isEmpty() || $patients->isEmpty() || $parentCategories->isEmpty()) {
            return;
        }

        for ($monthOffset = 0; $monthOffset < 12; $monthOffset++) {
            foreach ($branches as $branchIndex => $branch) {
                foreach ($parentCategories as $parentIndex => $parentCategory) {
                    $services = $servicesByParentCategory->get($parentCategory->major_service_category_ID);
                    $service = $services?->get(($monthOffset + $branchIndex) % $services->count());
                    $patient = $patients[(($monthOffset * 3) + $branchIndex + $parentIndex) % $patients->count()];
                    $processor = $processors->get($branch->branch_ID);

                    if ($service === null || $processor === null) {
                        continue;
                    }

                    $saleDate = CarbonImmutable::now()
                        ->subMonthsNoOverflow($monthOffset)
                        ->startOfMonth()
                        ->addDays(3 + ($parentIndex * 5) + $branchIndex);
                    $quantity = 1 + (($monthOffset + $branchIndex + $parentIndex) % 4);
                    $servicePrice = 650 + ($service->service_ID * 225);
                    $branchProducts = $products->where('branch_ID', $branch->branch_ID)->values();
                    $product = $branchProducts->isEmpty()
                        ? null
                        : $branchProducts->get(($monthOffset + $parentIndex) % $branchProducts->count());
                    $productQuantity = ($monthOffset + $parentIndex) % 3 === 0 && $product !== null ? 1 : 0;
                    $productTotal = $product === null ? 0.0 : $productQuantity * (float) $product->price;
                    $serviceTotal = $quantity * $servicePrice;
                    $subtotal = $serviceTotal + $productTotal;
                    $discountPercentage = $monthOffset % 4 === 0 ? 5 : 0;
                    $discountAmount = round($subtotal * ($discountPercentage / 100), 2);
                    $total = $subtotal - $discountAmount;

                    DB::transaction(function () use (
                        $branch,
                        $discountAmount,
                        $discountPercentage,
                        $patient,
                        $parentCategory,
                        $processor,
                        $product,
                        $productQuantity,
                        $productTotal,
                        $quantity,
                        $saleDate,
                        $service,
                        $servicePrice,
                        $serviceTotal,
                        $subtotal,
                        $total,
                    ): void {
                        $sale = Sale::query()->updateOrCreate(
                            ['invoice_number' => sprintf(
                                'DEMO-%s-B%d-P%d',
                                $saleDate->format('Ym'),
                                $branch->branch_ID,
                                $parentCategory->major_service_category_ID,
                            )],
                            [
                                'branch_ID' => $branch->branch_ID,
                                'branch_name' => $branch->branch_name,
                                'PID' => $patient->PID,
                                'processed_by' => $processor->account_ID,
                                'customer_name' => $patient->full_name,
                                'date' => $saleDate,
                                'subtotal_cost' => $subtotal,
                                'discount_perc' => $discountPercentage,
                                'discount_amount' => $discountAmount,
                                'total_cost' => $total,
                                'pay_method' => $parentCategory->major_service_category_ID % 2 === 0 ? 'gcash' : 'cash',
                                'amount_received' => $total,
                                'change_amount' => 0,
                                'finalized' => true,
                                'is_voided' => false,
                                'voided_at' => null,
                                'voided_by' => null,
                                'void_reason' => null,
                            ],
                        );
                        $timestamp = $saleDate->setTime(9 + $parentCategory->major_service_category_ID, 15);
                        $sale->forceFill(['created_at' => $timestamp, 'updated_at' => $timestamp])->saveQuietly();

                        $serviceItem = $sale->serviceItems()->updateOrCreate(
                            ['service_ID' => $service->service_ID],
                            [
                                'service_name' => $service->name,
                                'quantity' => $quantity,
                                'custom_price' => $servicePrice,
                                'line_total' => $serviceTotal,
                            ],
                        );
                        $serviceItem->forceFill(['created_at' => $timestamp, 'updated_at' => $timestamp])->saveQuietly();

                        if ($productQuantity > 0) {
                            $productItem = $sale->productItems()->updateOrCreate(
                                ['product_ID' => $product->product_ID],
                                [
                                    'product_name' => $product->name,
                                    'measurement_unit' => $product->measurement_unit,
                                    'quantity' => $productQuantity,
                                    'unit_price' => $product->price,
                                    'line_total' => $productTotal,
                                ],
                            );
                            $productItem->forceFill(['created_at' => $timestamp, 'updated_at' => $timestamp])->saveQuietly();
                        }
                    });
                }

                $expenseCategory = $expenseCategories->values()[$monthOffset % $expenseCategories->count()];
                $expenseDate = CarbonImmutable::now()->subMonthsNoOverflow($monthOffset)->startOfMonth()->addDays(20 + $branchIndex);
                $expense = Expense::query()->updateOrCreate(
                    [
                        'branch_ID' => $branch->branch_ID,
                        'description' => "Demo {$expenseCategory->category_name} expense",
                        'expense_date' => $expenseDate,
                    ],
                    [
                        'branch_name' => $branch->branch_name,
                        'category_ID' => $expenseCategory->category_ID,
                        'category_name' => $expenseCategory->category_name,
                        'account_ID' => $processors->get($branch->branch_ID)?->account_ID,
                        'amount' => 500 + ($monthOffset * 75) + ($branchIndex * 125),
                    ],
                );
                $expense->forceFill(['created_at' => $expenseDate, 'updated_at' => $expenseDate])->saveQuietly();
            }
        }
    }
}
