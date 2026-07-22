<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\InventoryNotificationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('inventory:sync-low-stock-notifications')]
#[Description('Create or clear low-stock system notifications for every inventory batch')]
class SyncLowStockNotifications extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(InventoryNotificationService $notifications): int
    {
        $processed = 0;

        Product::query()->chunkById(200, function ($products) use ($notifications, &$processed): void {
            foreach ($products as $product) {
                $notifications->sync($product);
                $processed++;
            }
        }, 'product_ID');

        $this->info("Low-stock notifications are current for {$processed} inventory batch(es).");

        return self::SUCCESS;
    }
}
