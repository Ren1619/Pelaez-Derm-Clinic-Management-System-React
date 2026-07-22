<?php

namespace App\Services;

use App\Models\Distribution;
use App\Models\DistributionItem;
use App\Models\Product;
use App\Models\StaffAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DistributionService
{
    public function __construct(private DistributionNotificationService $notifications) {}

    /**
     * @param array{
     *     from_branch_ID: int,
     *     to_branch_ID: int,
     *     scheduled_date?: string|null,
     *     notes?: string|null,
     *     items: list<array{product_ID: int, quantity: int}>
     * } $attributes
     */
    public function create(array $attributes, ?StaffAccount $creator): Distribution
    {
        return DB::transaction(function () use ($attributes, $creator): Distribution {
            $productIds = collect($attributes['items'])->pluck('product_ID');
            $products = Product::query()
                ->with('category:category_ID,category_name')
                ->whereIn('product_ID', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_ID');

            $distribution = Distribution::create([
                'from_branch_ID' => $attributes['from_branch_ID'],
                'to_branch_ID' => $attributes['to_branch_ID'],
                'created_by' => $creator?->account_ID,
                'status' => Distribution::Pending,
                'scheduled_date' => $attributes['scheduled_date'] ?? null,
                'notes' => $attributes['notes'] ?? null,
            ]);

            foreach ($attributes['items'] as $index => $selectedItem) {
                $product = $products->get($selectedItem['product_ID']);

                if ($product === null || $product->branch_ID !== $distribution->from_branch_ID) {
                    throw ValidationException::withMessages([
                        "items.{$index}.product_ID" => 'The selected product is not available at the source branch.',
                    ]);
                }

                if ($product->quantity < $selectedItem['quantity']) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Only {$product->quantity} {$product->measurement_unit} are currently available.",
                    ]);
                }

                $distribution->items()->create([
                    'product_ID' => $product->product_ID,
                    'category_ID' => $product->category_ID,
                    'product_name' => $product->name,
                    'category_name' => $product->category->category_name,
                    'measurement_unit' => $product->measurement_unit,
                    'quantity' => $selectedItem['quantity'],
                    'price' => $product->price,
                    'expiration_date' => $product->expiration_date,
                    'product_img' => $product->product_img,
                ]);
            }

            $distribution->load(['fromBranch', 'toBranch', 'createdBy', 'items']);
            $this->notifications->inboundCreated($distribution);

            return $distribution;
        }, attempts: 3);
    }

    public function send(Distribution $distribution): Distribution
    {
        return DB::transaction(function () use ($distribution): Distribution {
            $lockedDistribution = $this->lockDistribution($distribution);

            if ($lockedDistribution->status !== Distribution::Pending) {
                throw ValidationException::withMessages(['distribution' => 'Only pending distributions can be sent.']);
            }

            foreach ($lockedDistribution->items as $item) {
                $product = $item->product_ID === null
                    ? null
                    : Product::query()->lockForUpdate()->find($item->product_ID);

                if ($product === null || $product->branch_ID !== $lockedDistribution->from_branch_ID) {
                    throw ValidationException::withMessages([
                        'distribution' => "{$item->product_name} is no longer available at the source branch.",
                    ]);
                }

                if ($product->quantity < $item->quantity) {
                    throw ValidationException::withMessages([
                        'distribution' => "{$item->product_name} has insufficient stock. Available: {$product->quantity} {$item->measurement_unit}.",
                    ]);
                }

                $product->decrement('quantity', $item->quantity);
            }

            $lockedDistribution->update(['status' => Distribution::InTransit, 'sent_date' => now()]);

            return $lockedDistribution->refresh();
        }, attempts: 3);
    }

    public function receive(Distribution $distribution): Distribution
    {
        return DB::transaction(function () use ($distribution): Distribution {
            $lockedDistribution = $this->lockDistribution($distribution);

            if ($lockedDistribution->status !== Distribution::InTransit) {
                throw ValidationException::withMessages(['distribution' => 'Only in-transit distributions can be received.']);
            }

            foreach ($lockedDistribution->items as $item) {
                $this->addItemToBranch($item, $lockedDistribution->to_branch_ID);
            }

            $lockedDistribution->update(['status' => Distribution::Delivered, 'received_date' => now()]);
            $this->notifications->received($lockedDistribution);

            return $lockedDistribution->refresh();
        }, attempts: 3);
    }

    public function cancel(Distribution $distribution, string $reason): Distribution
    {
        return DB::transaction(function () use ($distribution, $reason): Distribution {
            $lockedDistribution = $this->lockDistribution($distribution);

            if (! in_array($lockedDistribution->status, [Distribution::Pending, Distribution::InTransit], true)) {
                throw ValidationException::withMessages(['distribution' => 'This distribution can no longer be cancelled.']);
            }

            if ($lockedDistribution->status === Distribution::InTransit) {
                foreach ($lockedDistribution->items as $item) {
                    $this->addItemToBranch($item, $lockedDistribution->from_branch_ID);
                }
            }

            $lockedDistribution->update([
                'status' => Distribution::Cancelled,
                'cancellation_reason' => $reason,
            ]);

            return $lockedDistribution->refresh();
        }, attempts: 3);
    }

    private function lockDistribution(Distribution $distribution): Distribution
    {
        return Distribution::query()
            ->with('items')
            ->lockForUpdate()
            ->findOrFail($distribution->distribution_ID);
    }

    private function addItemToBranch(DistributionItem $item, int $branchId): void
    {
        $matchingBatch = Product::query()
            ->where('branch_ID', $branchId)
            ->where('name', $item->product_name)
            ->when(
                $item->expiration_date,
                fn ($query) => $query->whereDate('expiration_date', $item->expiration_date),
                fn ($query) => $query->whereNull('expiration_date'),
            )
            ->lockForUpdate()
            ->first();

        if ($matchingBatch !== null) {
            if ($matchingBatch->quantity + $item->quantity > 999999) {
                throw ValidationException::withMessages([
                    'distribution' => "Receiving {$item->product_name} would exceed the maximum batch quantity.",
                ]);
            }

            $matchingBatch->increment('quantity', $item->quantity);

            return;
        }

        if ($item->category_ID === null) {
            throw ValidationException::withMessages([
                'distribution' => "The category for {$item->product_name} no longer exists.",
            ]);
        }

        Product::create([
            'category_ID' => $item->category_ID,
            'branch_ID' => $branchId,
            'name' => $item->product_name,
            'measurement_unit' => $item->measurement_unit,
            'price' => $item->price,
            'quantity' => $item->quantity,
            'expiration_date' => $item->expiration_date,
            'product_img' => $item->product_img,
        ]);
    }
}
