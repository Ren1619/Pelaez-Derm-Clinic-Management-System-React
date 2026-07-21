<?php

namespace App\Services\POS;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleProductItem;
use App\Models\SaleReturn;
use App\Models\SaleServiceItem;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcessSaleReturnService
{
    /** @param array<string, mixed> $data */
    public function void(Sale $sale, array $data, StaffAccount|User $user): SaleReturn
    {
        return DB::transaction(function () use ($sale, $data, $user): SaleReturn {
            $lockedSale = $this->lockedSale($sale);
            $this->ensureReturnable($lockedSale);

            if ($lockedSale->returns()->exists()) {
                throw ValidationException::withMessages(['sale' => 'A sale with prior returns cannot be fully voided.']);
            }

            $return = $lockedSale->returns()->create([
                'return_type' => 'full',
                'return_amount' => $lockedSale->total_cost,
                'return_reason' => $data['reason'],
                'refund_method' => $data['refund_method'],
                'processed_by' => $user->getAuthIdentifier(),
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($lockedSale->productItems as $item) {
                $this->recordReturnItem($return, 'product', $item, $item->quantity, true);
                $this->restock($item, $item->quantity);
            }

            foreach ($lockedSale->serviceItems as $item) {
                $this->recordReturnItem($return, 'service', $item, $item->quantity, false);
            }

            $lockedSale->update([
                'is_voided' => true,
                'voided_at' => now(),
                'voided_by' => $user->getAuthIdentifier(),
                'void_reason' => $data['reason'],
            ]);

            return $return->load('items');
        }, attempts: 3);
    }

    /** @param array<string, mixed> $data */
    public function partial(Sale $sale, array $data, StaffAccount|User $user): SaleReturn
    {
        return DB::transaction(function () use ($sale, $data, $user): SaleReturn {
            $lockedSale = $this->lockedSale($sale);
            $this->ensureReturnable($lockedSale);
            $requestedItems = collect($this->requestedItems($data));
            $returnLines = [];
            $seenItems = [];

            foreach ($requestedItems as $index => $requested) {
                $type = (string) $requested['type'];
                $itemId = (int) $requested['item_ID'];
                $quantity = (int) $requested['quantity'];
                $itemKey = $type.'|'.$itemId;

                if (isset($seenItems[$itemKey])) {
                    throw ValidationException::withMessages([
                        "items.{$index}.item_ID" => 'A sale item may only appear once in a return.',
                    ]);
                }

                $seenItems[$itemKey] = true;
                $item = $type === 'product'
                    ? $lockedSale->productItems->firstWhere('sale_product_item_ID', $itemId)
                    : $lockedSale->serviceItems->firstWhere('sale_service_item_ID', $itemId);

                if (! $item instanceof Model) {
                    throw ValidationException::withMessages(["items.{$index}.item_ID" => 'The selected sale item is invalid.']);
                }

                $alreadyReturned = $lockedSale->returns
                    ->flatMap->items
                    ->where('item_type', $type)
                    ->where('sale_item_ID', $itemId)
                    ->sum('quantity_returned');
                $available = $item->quantity - $alreadyReturned;

                if ($quantity > $available) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Only {$available} units remain eligible for return.",
                    ]);
                }

                $returnLines[] = ['type' => $type, 'item' => $item, 'quantity' => $quantity];
            }

            $grossAmount = collect($returnLines)->sum(function (array $line): float {
                $item = $line['item'];
                $price = $item instanceof SaleProductItem
                    ? (float) $item->unit_price
                    : (float) $item->custom_price;

                return $price * $line['quantity'];
            });
            $returnAmount = round($grossAmount * (1 - ((float) $lockedSale->discount_perc / 100)), 2);

            $return = $lockedSale->returns()->create([
                'return_type' => 'partial',
                'return_amount' => $returnAmount,
                'return_reason' => $data['reason'],
                'refund_method' => $data['refund_method'],
                'processed_by' => $user->getAuthIdentifier(),
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($returnLines as $line) {
                $isProduct = $line['type'] === 'product';
                $this->recordReturnItem($return, $line['type'], $line['item'], $line['quantity'], $isProduct);

                if ($isProduct && $line['item'] instanceof SaleProductItem) {
                    $this->restock($line['item'], $line['quantity']);
                }
            }

            return $return->load('items');
        }, attempts: 3);
    }

    private function lockedSale(Sale $sale): Sale
    {
        return Sale::query()
            ->with(['productItems', 'serviceItems', 'returns.items'])
            ->lockForUpdate()
            ->findOrFail($sale->sale_ID);
    }

    private function ensureReturnable(Sale $sale): void
    {
        if ($sale->is_voided) {
            throw ValidationException::withMessages(['sale' => 'This sale has already been voided.']);
        }

        if ($sale->created_at?->lt(now()->subDays(30))) {
            throw ValidationException::withMessages(['sale' => 'Returns are only allowed within 30 days of purchase.']);
        }

        if ((float) $sale->returns->sum('return_amount') >= (float) $sale->total_cost) {
            throw ValidationException::withMessages(['sale' => 'This sale has already been fully returned.']);
        }
    }

    private function recordReturnItem(
        SaleReturn $return,
        string $type,
        SaleProductItem|SaleServiceItem $item,
        int $quantity,
        bool $restocked,
    ): void {
        $isProduct = $item instanceof SaleProductItem;
        $price = (float) ($isProduct ? $item->unit_price : $item->custom_price);

        $return->items()->create([
            'item_type' => $type,
            'sale_item_ID' => $isProduct ? $item->sale_product_item_ID : $item->sale_service_item_ID,
            'item_name' => $isProduct ? $item->product_name : $item->service_name,
            'quantity_returned' => $quantity,
            'item_price' => $price,
            'subtotal' => round($price * $quantity, 2),
            'restocked' => $restocked,
        ]);
    }

    private function restock(SaleProductItem $item, int $quantity): void
    {
        if ($item->product_ID === null) {
            return;
        }

        Product::query()->whereKey($item->product_ID)->lockForUpdate()->first()?->increment('quantity', $quantity);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<int, array{type: string, item_ID: int, quantity: int}>
     */
    private function requestedItems(array $data): array
    {
        $items = $data['items'] ?? [];

        if (! is_array($items)) {
            return [];
        }

        return array_values(array_map(fn (array $item): array => [
            'type' => (string) $item['type'],
            'item_ID' => (int) $item['item_ID'],
            'quantity' => (int) $item['quantity'],
        ], $items));
    }
}
