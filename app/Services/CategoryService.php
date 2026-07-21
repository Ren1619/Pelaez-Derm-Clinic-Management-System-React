<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;

class CategoryService
{
    /**
     * @return array{products: int, services: int}
     */
    public function statistics(): array
    {
        return [
            'products' => Category::query()->where('category_type', 'Product')->count(),
            'services' => Category::query()->where('category_type', 'Service')->count(),
        ];
    }

    /** @return LengthAwarePaginator<int, Category> */
    public function paginate(string $categoryType, string $search, int $perPage): LengthAwarePaginator
    {
        return Category::query()
            ->select([
                'category_ID',
                'category_name',
                'category_type',
                'description',
                'created_at',
            ])
            ->where('category_type', $categoryType)
            ->when(
                $search,
                fn ($query, string $searchTerm) => $query->whereLike('category_name', "%{$searchTerm}%"),
            )
            ->orderBy('category_name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Category
    {
        return Category::create($attributes);
    }

    /** @param array<string, mixed> $attributes */
    public function update(Category $category, array $attributes): Category
    {
        $category->update($attributes);

        return $category->refresh();
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }
}
