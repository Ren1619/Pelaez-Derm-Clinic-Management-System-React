<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
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
                'major_service_category_ID',
                'description',
                'created_at',
            ])
            ->with('majorServiceCategory:major_service_category_ID,name')
            ->where('category_type', $categoryType)
            ->when(
                $search,
                fn (Builder $query, string $searchTerm): Builder => $query->where(
                    fn (Builder $searchQuery): Builder => $searchQuery
                        ->whereLike('category_name', "%{$searchTerm}%")
                        ->orWhereHas(
                            'majorServiceCategory',
                            fn (Builder $majorCategoryQuery): Builder => $majorCategoryQuery
                                ->whereLike('name', "%{$searchTerm}%"),
                        ),
                ),
            )
            ->orderBy('major_service_category_ID')
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
