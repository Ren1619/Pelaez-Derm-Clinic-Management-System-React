<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\StaffAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PosSeeder extends Seeder
{
    public function run(): void
    {
        $categories = collect(['Clinic Supplies', 'Utilities', 'Transportation', 'Maintenance'])
            ->mapWithKeys(fn (string $name): array => [
                $name => ExpenseCategory::query()->firstOrCreate(['category_name' => $name]),
            ]);

        if (Sale::query()->exists()) {
            return;
        }

        $branch = Branch::query()->first();
        $product = Product::query()->where('quantity', '>=', 2)->whereDate('expiration_date', '>=', today())->first();
        $service = Service::query()->first();
        $patient = Patient::query()->first();
        $user = StaffAccount::query()->first();

        if ($branch === null || $product === null || $service === null || $user === null) {
            return;
        }

        DB::transaction(function () use ($branch, $categories, $patient, $product, $service, $user): void {
            $productTotal = round((float) $product->price * 2, 2);
            $servicePrice = 800.00;
            $subtotal = $productTotal + $servicePrice;

            $sale = Sale::create([
                'invoice_number' => 'INV-'.now()->format('Ymd').'-DEMO01',
                'branch_ID' => $branch->branch_ID,
                'branch_name' => $branch->branch_name,
                'PID' => $patient?->PID,
                'processed_by' => $user->account_ID,
                'customer_name' => $patient === null ? 'Walk-in Customer' : $patient->full_name,
                'date' => today(),
                'subtotal_cost' => $subtotal,
                'discount_perc' => 0,
                'discount_amount' => 0,
                'total_cost' => $subtotal,
                'pay_method' => 'cash',
                'amount_received' => ceil($subtotal / 100) * 100,
                'change_amount' => ceil($subtotal / 100) * 100 - $subtotal,
                'finalized' => true,
            ]);

            $sale->productItems()->create([
                'product_ID' => $product->product_ID,
                'product_name' => $product->name,
                'measurement_unit' => $product->measurement_unit,
                'quantity' => 2,
                'unit_price' => $product->price,
                'line_total' => $productTotal,
            ]);
            $sale->serviceItems()->create([
                'service_ID' => $service->service_ID,
                'service_name' => $service->name,
                'quantity' => 1,
                'custom_price' => $servicePrice,
                'line_total' => $servicePrice,
            ]);
            $product->decrement('quantity', 2);

            $expenseCategory = $categories->get('Clinic Supplies');
            Expense::create([
                'branch_ID' => $branch->branch_ID,
                'branch_name' => $branch->branch_name,
                'category_ID' => $expenseCategory->category_ID,
                'category_name' => $expenseCategory->category_name,
                'account_ID' => $user->account_ID,
                'description' => 'Daily consumable clinic supplies',
                'amount' => 650,
                'expense_date' => today(),
            ]);
        });
    }
}
