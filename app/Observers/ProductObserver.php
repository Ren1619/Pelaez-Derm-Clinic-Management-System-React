<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\InventoryNotificationService;

class ProductObserver
{
    public function __construct(private InventoryNotificationService $notifications) {}

    public function created(Product $product): void
    {
        $this->notifications->sync($product);
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $this->notifications->sync($product);
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        $this->notifications->remove($product);
    }
}
