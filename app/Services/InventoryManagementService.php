<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class InventoryManagementService
{
    /**
     * @return array{
     *     total: int,
     *     in_stock: int,
     *     low_stock: int,
     *     out_of_stock: int,
     *     expiring: int,
     *     expired: int
     * }
     */
    public function statistics(?int $branchId): array
    {
        $today = today()->toDateString();
        $expirationThreshold = today()->addMonth()->toDateString();

        $statistics = Product::query()
            ->when($branchId, fn (Builder $query, int $selectedBranchId): Builder => $query
                ->where('branch_ID', $selectedBranchId))
            ->toBase()
            ->selectRaw('COUNT(DISTINCT CASE WHEN expiration_date IS NOT NULL THEN name END) AS total')
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN expiration_date >= ? AND quantity > 20 THEN name END) AS in_stock',
                [$today],
            )
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN expiration_date >= ? AND quantity BETWEEN 1 AND 20 THEN name END) AS low_stock',
                [$today],
            )
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN expiration_date >= ? AND quantity = 0 THEN name END) AS out_of_stock',
                [$today],
            )
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN expiration_date BETWEEN ? AND ? THEN name END) AS expiring',
                [$today, $expirationThreshold],
            )
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN expiration_date < ? THEN name END) AS expired',
                [$today],
            )
            ->first();

        return [
            'total' => (int) ($statistics->total ?? 0),
            'in_stock' => (int) ($statistics->in_stock ?? 0),
            'low_stock' => (int) ($statistics->low_stock ?? 0),
            'out_of_stock' => (int) ($statistics->out_of_stock ?? 0),
            'expiring' => (int) ($statistics->expiring ?? 0),
            'expired' => (int) ($statistics->expired ?? 0),
        ];
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    public function paginate(
        string $status,
        string $view,
        string $search,
        ?int $branchId,
        int $perPage,
    ): LengthAwarePaginator {
        if ($view === 'detailed') {
            return $this->paginateDetailed($status, $search, $branchId, $perPage);
        }

        return $this->paginateGrouped($status, $search, $branchId, $perPage);
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array{product: Product, merged: bool}
     */
    public function createOrMergeBatch(array $attributes, ?UploadedFile $image): array
    {
        $newImagePath = $this->storeImage($image);
        $oldImagePath = null;

        try {
            $result = DB::transaction(function () use ($attributes, $newImagePath, &$oldImagePath): array {
                $existingBatch = Product::query()
                    ->whereRaw('LOWER(TRIM(name)) = ?', [Str::lower((string) $attributes['name'])])
                    ->where('branch_ID', $attributes['branch_ID'])
                    ->whereDate('expiration_date', $attributes['expiration_date'])
                    ->lockForUpdate()
                    ->first();

                if ($existingBatch === null) {
                    return [
                        'product' => Product::create([
                            ...$attributes,
                            'product_img' => $newImagePath,
                        ]),
                        'merged' => false,
                    ];
                }

                $newQuantity = $existingBatch->quantity + (int) $attributes['quantity'];

                if ($newQuantity > 999999) {
                    throw ValidationException::withMessages([
                        'quantity' => 'The resulting batch quantity cannot exceed 999999.',
                    ]);
                }

                $oldImagePath = $existingBatch->product_img;
                $existingBatch->update([
                    'quantity' => $newQuantity,
                    'price' => $attributes['price'],
                    ...($newImagePath !== null ? ['product_img' => $newImagePath] : []),
                ]);

                return [
                    'product' => $existingBatch->refresh(),
                    'merged' => true,
                ];
            }, attempts: 3);
        } catch (Throwable $exception) {
            $this->deleteImage($newImagePath);

            throw $exception;
        }

        if ($newImagePath !== null) {
            $this->deleteImage($oldImagePath);
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array{product: Product, merged: bool}
     */
    public function restock(Product $product, array $attributes, ?UploadedFile $image): array
    {
        return $this->createOrMergeBatch([
            'name' => $product->name,
            'category_ID' => $product->category_ID,
            'branch_ID' => $product->branch_ID,
            'measurement_unit' => $product->measurement_unit,
            'quantity' => $attributes['quantity'],
            'price' => $attributes['price'],
            'expiration_date' => $attributes['expiration_date'],
        ], $image);
    }

    /** @param array<string, mixed> $attributes */
    public function update(Product $product, array $attributes, ?UploadedFile $image): Product
    {
        $newImagePath = $this->storeImage($image);
        $oldImagePath = $product->product_img;

        try {
            $product->update([
                ...$attributes,
                ...($newImagePath !== null ? ['product_img' => $newImagePath] : []),
            ]);
        } catch (Throwable $exception) {
            $this->deleteImage($newImagePath);

            throw $exception;
        }

        if ($newImagePath !== null) {
            $this->deleteImage($oldImagePath);
        }

        return $product->refresh();
    }

    public function delete(Product $product): void
    {
        $imagePath = $product->product_img;

        $product->delete();

        $this->deleteImage($imagePath);
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    private function paginateDetailed(
        string $status,
        string $search,
        ?int $branchId,
        int $perPage,
    ): LengthAwarePaginator {
        $products = $this->filteredQuery($status, $search, $branchId)
            ->with([
                'category:category_ID,category_name,category_type',
                'branch:branch_ID,branch_name',
            ])
            ->orderBy('name')
            ->orderBy('expiration_date')
            ->paginate($perPage)
            ->withQueryString();

        $metadata = $this->batchMetadata($products->getCollection());

        return $products->through(fn (Product $product): array => $this->serializeProductPayload(
            $product,
            $metadata[$product->product_ID]['batch_number'] ?? null,
            $metadata[$product->product_ID]['is_primary'] ?? false,
        ));
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    private function paginateGrouped(
        string $status,
        string $search,
        ?int $branchId,
        int $perPage,
    ): LengthAwarePaginator {
        $groups = $this->filteredQuery($status, $search, $branchId)
            ->select(['name', 'branch_ID'])
            ->selectRaw('COUNT(*) AS batch_count')
            ->selectRaw('SUM(quantity) AS total_quantity')
            ->groupBy('name', 'branch_ID')
            ->orderBy('name')
            ->orderBy('branch_ID')
            ->paginate($perPage)
            ->withQueryString();

        $groupRows = $groups->getCollection();

        $batches = $this->loadGroupedBatches($groupRows, $status, $search, $branchId);

        return $groups->through(function (Product $group) use ($batches): array {
            $groupBatches = $batches->get($this->groupKey($group->name, (int) $group->branch_ID));

            if ($groupBatches === null) {
                throw new RuntimeException('The inventory group batches could not be loaded.');
            }

            return $this->serializeGroup($group, $groupBatches);
        });
    }

    /**
     * @param Collection<int, Product> $groupRows
     * @return Collection<int|string, EloquentCollection<int, Product>>
     */
    private function loadGroupedBatches(
        Collection $groupRows,
        string $status,
        string $search,
        ?int $branchId,
    ): Collection {
        $query = $this->filteredQuery($status, $search, $branchId)
            ->with([
                'category:category_ID,category_name,category_type',
                'branch:branch_ID,branch_name',
            ]);

        if ($groupRows->isEmpty()) {
            $query->whereKey(-1);
        } else {
            $query->where(function (Builder $query) use ($groupRows): void {
                $groupRows->each(function (Product $group) use ($query): void {
                    $query->orWhere(fn (Builder $pairQuery): Builder => $pairQuery
                        ->where('name', $group->name)
                        ->where('branch_ID', $group->branch_ID));
                });
            });
        }

        $groupedBatches = $query
            ->orderBy('name')
            ->orderBy('expiration_date')
            ->get()
            ->groupBy(fn (Product $product): string => $this->groupKey($product->name, $product->branch_ID));

        return collect($groupedBatches->all());
    }

    /** @return Builder<Product> */
    private function filteredQuery(string $status, string $search, ?int $branchId): Builder
    {
        $today = today()->toDateString();
        $expirationThreshold = today()->addMonth()->toDateString();

        return Product::query()
            ->select([
                'product_ID',
                'category_ID',
                'branch_ID',
                'name',
                'measurement_unit',
                'price',
                'quantity',
                'expiration_date',
                'product_img',
                'created_at',
            ])
            ->whereNotNull('expiration_date')
            ->when($search, fn (Builder $query, string $searchTerm): Builder => $query->where(
                fn (Builder $searchQuery): Builder => $searchQuery
                    ->where('name', 'like', "%{$searchTerm}%")
                    ->orWhereIn('category_ID', Category::query()
                        ->where('category_name', 'like', "%{$searchTerm}%")
                        ->select('category_ID'))
                    ->orWhereIn('branch_ID', Branch::query()
                        ->where('branch_name', 'like', "%{$searchTerm}%")
                        ->select('branch_ID')),
            ))
            ->when($branchId, fn (Builder $query, int $selectedBranchId): Builder => $query
                ->where('branch_ID', $selectedBranchId))
            ->when($status === 'in-stock', fn (Builder $query): Builder => $query
                ->where('quantity', '>', 20)
                ->where('expiration_date', '>=', $today))
            ->when($status === 'low-stock', fn (Builder $query): Builder => $query
                ->whereBetween('quantity', [1, 20])
                ->where('expiration_date', '>=', $today))
            ->when($status === 'out-of-stock', fn (Builder $query): Builder => $query
                ->where('quantity', 0)
                ->where('expiration_date', '>=', $today))
            ->when($status === 'expiring', fn (Builder $query): Builder => $query
                ->whereBetween('expiration_date', [$today, $expirationThreshold]))
            ->when($status === 'expired', fn (Builder $query): Builder => $query
                ->where('expiration_date', '<', $today));
    }

    /**
     * @param Collection<int, Product> $products
     * @return array<int, array{batch_number: int, is_primary: bool}>
     */
    private function batchMetadata(Collection $products): array
    {
        if ($products->isEmpty()) {
            return [];
        }

        $activeBatches = Product::query()
            ->select(['product_ID', 'name', 'branch_ID', 'expiration_date'])
            ->whereNotNull('expiration_date')
            ->where('quantity', '>', 0)
            ->where(function (Builder $query) use ($products): void {
                $products
                    ->unique(fn (Product $product): string => $this->groupKey($product->name, $product->branch_ID))
                    ->each(function (Product $product) use ($query): void {
                        $query->orWhere(fn (Builder $pairQuery): Builder => $pairQuery
                            ->where('name', $product->name)
                            ->where('branch_ID', $product->branch_ID));
                    });
            })
            ->orderBy('expiration_date')
            ->get()
            ->groupBy(fn (Product $product): string => $this->groupKey($product->name, $product->branch_ID));

        $metadata = [];

        $activeBatches->each(function (Collection $batches) use (&$metadata): void {
            $batches->values()->each(function (Product $batch, int $index) use (&$metadata): void {
                $metadata[$batch->product_ID] = [
                    'batch_number' => $index + 1,
                    'is_primary' => $index === 0,
                ];
            });
        });

        return $metadata;
    }

    /**
     * @param EloquentCollection<int, Product> $groupBatches
     * @return array<string, mixed>
     */
    private function serializeGroup(Product $group, EloquentCollection $groupBatches): array
    {
        $primaryBatch = $groupBatches->firstOrFail();

        return [
            'key' => $this->groupKey($primaryBatch->name, $primaryBatch->branch_ID),
            'name' => $primaryBatch->name,
            'branch_ID' => $primaryBatch->branch_ID,
            'category_ID' => $primaryBatch->category_ID,
            'measurement_unit' => $primaryBatch->measurement_unit,
            'price' => $primaryBatch->price,
            'product_img' => $primaryBatch->product_img,
            'image_url' => $this->imageUrl($primaryBatch->product_img),
            'batch_count' => (int) $group->getAttribute('batch_count'),
            'total_quantity' => (int) $group->getAttribute('total_quantity'),
            'primary_expiration_date' => $primaryBatch->expiration_date?->toDateString(),
            'category' => [
                'category_ID' => $primaryBatch->category->category_ID,
                'category_name' => $primaryBatch->category->category_name,
            ],
            'branch' => [
                'branch_ID' => $primaryBatch->branch->branch_ID,
                'branch_name' => $primaryBatch->branch->branch_name,
            ],
            'can_restock' => $primaryBatch->branch_ID === 1,
            'primary_batch' => $this->serializeProductPayload($primaryBatch, 1, true),
            'batches' => $groupBatches
                ->values()
                ->map(fn (Product $batch, int $index): array => $this->serializeProductPayload(
                    $batch,
                    $index + 1,
                    $index === 0,
                ))
                ->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function serializeProductPayload(Product $product, ?int $batchNumber, bool $isPrimary): array
    {
        $daysUntilExpiration = $product->expiration_date === null
            ? null
            : (int) today()->diffInDays($product->expiration_date, false);

        return [
            'product_ID' => $product->product_ID,
            'category_ID' => $product->category_ID,
            'branch_ID' => $product->branch_ID,
            'name' => $product->name,
            'measurement_unit' => $product->measurement_unit,
            'price' => $product->price,
            'quantity' => $product->quantity,
            'expiration_date' => $product->expiration_date?->toDateString(),
            'days_until_expiration' => $daysUntilExpiration,
            'expiration_status' => match (true) {
                $daysUntilExpiration === null => null,
                $daysUntilExpiration < 0 => 'expired',
                $daysUntilExpiration <= 30 => 'expiring-soon',
                default => null,
            },
            'product_img' => $product->product_img,
            'image_url' => $this->imageUrl($product->product_img),
            'batch_number' => $batchNumber,
            'is_primary' => $isPrimary,
            'can_restock' => $product->branch_ID === 1,
            'category' => [
                'category_ID' => $product->category->category_ID,
                'category_name' => $product->category->category_name,
            ],
            'branch' => [
                'branch_ID' => $product->branch->branch_ID,
                'branch_name' => $product->branch->branch_name,
            ],
            'created_at' => $product->created_at?->toISOString(),
        ];
    }

    private function storeImage(?UploadedFile $image): ?string
    {
        if ($image === null) {
            return null;
        }

        $imagePath = $image->store('products', 'public');

        if ($imagePath === false) {
            throw new RuntimeException('The product image could not be stored.');
        }

        return $imagePath;
    }

    private function imageUrl(?string $imagePath): ?string
    {
        return $imagePath === null ? null : Storage::disk('public')->url($imagePath);
    }

    private function deleteImage(?string $imagePath): void
    {
        if ($imagePath !== null) {
            Storage::disk('public')->delete($imagePath);
        }
    }

    private function groupKey(string $name, int $branchId): string
    {
        return $name.'|'.$branchId;
    }
}
