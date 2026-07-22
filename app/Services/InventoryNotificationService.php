<?php

namespace App\Services;

use App\Models\Product;

class InventoryNotificationService
{
    public const LowStockThreshold = 20;

    public function __construct(private SystemNotificationService $notifications) {}

    public function sync(Product $product): void
    {
        $deduplicationKey = $this->deduplicationKey($product);
        $isCurrentStock = $product->expiration_date === null
            || $product->expiration_date->greaterThanOrEqualTo(today());

        if (! $isCurrentStock || $product->quantity > self::LowStockThreshold) {
            $this->notifications->removeByDeduplicationKey($deduplicationKey);

            return;
        }

        $stockLabel = $product->quantity === 0
            ? 'out of stock'
            : "very low at {$product->quantity} {$product->measurement_unit}";

        $this->notifications->create([
            'sender_id' => null,
            'sender_type' => 'system',
            'receiver_id' => null,
            'receiver_type' => 'staff',
            'branch_id' => $product->branch_ID,
            'appointment_id' => null,
            'type' => 'inventory_low_stock',
            'deduplication_key' => $deduplicationKey,
            'title' => 'Very low inventory stock',
            'message' => "{$product->name} is {$stockLabel}.",
            'data' => [
                'product_id' => $product->product_ID,
                'product_name' => $product->name,
                'quantity' => $product->quantity,
                'measurement_unit' => $product->measurement_unit,
            ],
        ]);
    }

    public function remove(Product $product): void
    {
        $this->notifications->removeByDeduplicationKey($this->deduplicationKey($product));
    }

    private function deduplicationKey(Product $product): string
    {
        return "inventory-low-stock:{$product->product_ID}";
    }
}
