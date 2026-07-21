<?php

namespace App\Services\POS;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProcessSaleService
{
    /** @param array<string, mixed> $data */
    public function create(array $data, StaffAccount|User $user): Sale
    {
        return DB::transaction(function () use ($data, $user): Sale {
            $branch = Branch::query()->findOrFail((int) $data['branch_ID']);
            $productLines = $this->allocateProducts($data['products'], $branch->branch_ID);
            $serviceLines = $this->prepareServices($data['services']);

            if ($productLines === [] && $serviceLines === []) {
                throw ValidationException::withMessages(['cart' => 'Add at least one product or service before checkout.']);
            }

            $subtotal = round(
                collect($productLines)->sum('line_total') + collect($serviceLines)->sum('line_total'),
                2,
            );
            $discountPercentage = (float) $data['discount_percentage'];
            $discountAmount = round($subtotal * ($discountPercentage / 100), 2);
            $total = max(0, round($subtotal - $discountAmount, 2));
            $paymentMethod = (string) $data['payment_method'];
            $amountReceived = $paymentMethod === 'cash' ? (float) ($data['amount_received'] ?? 0) : $total;

            if ($paymentMethod === 'cash' && $amountReceived < $total) {
                throw ValidationException::withMessages([
                    'amount_received' => 'The received amount must cover the sale total.',
                ]);
            }

            $sale = Sale::create([
                'invoice_number' => $this->invoiceNumber(),
                'branch_ID' => $branch->branch_ID,
                'branch_name' => $branch->branch_name,
                'PID' => $data['PID'] ?? null,
                'processed_by' => $user->getAuthIdentifier(),
                'customer_name' => $data['customer_name'],
                'date' => today(),
                'subtotal_cost' => $subtotal,
                'discount_perc' => $discountPercentage,
                'discount_amount' => $discountAmount,
                'total_cost' => $total,
                'pay_method' => $paymentMethod,
                'amount_received' => $amountReceived,
                'change_amount' => max(0, round($amountReceived - $total, 2)),
                'finalized' => true,
            ]);

            foreach ($productLines as $line) {
                $product = $line['product'];
                $quantity = $line['quantity'];

                $sale->productItems()->create([
                    'product_ID' => $product->product_ID,
                    'product_name' => $product->name,
                    'measurement_unit' => $product->measurement_unit,
                    'quantity' => $quantity,
                    'unit_price' => $line['unit_price'],
                    'line_total' => $line['line_total'],
                ]);

                $product->decrement('quantity', $quantity);
            }

            foreach ($serviceLines as $line) {
                $service = $line['service'];

                $sale->serviceItems()->create([
                    'service_ID' => $service->service_ID,
                    'service_name' => $service->name,
                    'quantity' => $line['quantity'],
                    'custom_price' => $line['custom_price'],
                    'line_total' => $line['line_total'],
                ]);
            }

            return $sale->load(['productItems', 'serviceItems']);
        }, attempts: 3);
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array{product: Product, quantity: int, unit_price: float, line_total: float}>
     */
    private function allocateProducts(array $items, int $branchId): array
    {
        $lines = [];
        $seenGroups = [];

        usort($items, fn (array $left, array $right): int => (int) $left['product_ID'] <=> (int) $right['product_ID']);

        foreach ($items as $index => $item) {
            $primary = Product::query()->lockForUpdate()->find((int) $item['product_ID']);

            if ($primary === null || $primary->branch_ID !== $branchId) {
                throw ValidationException::withMessages([
                    "products.{$index}.product_ID" => 'The selected product is not available at this branch.',
                ]);
            }

            $groupKey = mb_strtolower(trim($primary->name)).'|'.$primary->branch_ID;

            if (isset($seenGroups[$groupKey])) {
                throw ValidationException::withMessages(['products' => 'A product may only appear once in the cart.']);
            }

            $seenGroups[$groupKey] = true;
            $requestedQuantity = (int) $item['quantity'];
            $remainingQuantity = $requestedQuantity;
            $unitPrice = (float) $primary->price;
            $batches = Product::query()
                ->where('branch_ID', $branchId)
                ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($primary->name))])
                ->where('quantity', '>', 0)
                ->whereDate('expiration_date', '>=', today())
                ->orderBy('expiration_date')
                ->orderBy('product_ID')
                ->lockForUpdate()
                ->get();

            foreach ($batches as $batch) {
                if ($remainingQuantity === 0) {
                    break;
                }

                $quantity = min($remainingQuantity, $batch->quantity);
                $lines[] = [
                    'product' => $batch,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => round($unitPrice * $quantity, 2),
                ];
                $remainingQuantity -= $quantity;
            }

            if ($remainingQuantity > 0) {
                throw ValidationException::withMessages([
                    "products.{$index}.quantity" => "Only ".($requestedQuantity - $remainingQuantity)." units of {$primary->name} are available.",
                ]);
            }
        }

        return $lines;
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array{service: Service, quantity: int, custom_price: float, line_total: float}>
     */
    private function prepareServices(array $items): array
    {
        if ($items === []) {
            return [];
        }

        $services = Service::query()
            ->whereKey(collect($items)->pluck('service_ID')->map(fn (mixed $id): int => (int) $id))
            ->get()
            ->keyBy('service_ID');

        return collect($items)->map(function (array $item, int $index) use ($services): array {
            $service = $services->get((int) $item['service_ID']);

            if (! $service instanceof Service) {
                throw ValidationException::withMessages([
                    "services.{$index}.service_ID" => 'The selected service is no longer available.',
                ]);
            }

            $quantity = (int) $item['quantity'];
            $customPrice = (float) $item['custom_price'];

            return [
                'service' => $service,
                'quantity' => $quantity,
                'custom_price' => $customPrice,
                'line_total' => round($customPrice * $quantity, 2),
            ];
        })->values()->all();
    }

    private function invoiceNumber(): string
    {
        do {
            $invoiceNumber = 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Sale::query()->where('invoice_number', $invoiceNumber)->exists());

        return $invoiceNumber;
    }
}
