<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\MajorServiceCategory;
use App\Services\CategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $categoryService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Category::class);

        $activeTab = in_array($request->string('tab')->toString(), ['products', 'services'], true)
            ? $request->string('tab')->toString()
            : 'products';
        $search = $request->string('search')->squish()->toString();
        $requestedPerPage = $request->integer('per_page', 10);
        $perPage = in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10;
        $categoryType = $activeTab === 'products' ? 'Product' : 'Service';

        return Inertia::render('categories/index', [
            'categories' => $this->categoryService
                ->paginate($categoryType, $search, $perPage)
                ->through(fn (Category $category): array => $this->serializeCategory($category)),
            'filters' => [
                'tab' => $activeTab,
                'search' => $search,
                'per_page' => $perPage,
            ],
            'majorServiceCategories' => MajorServiceCategory::query()
                ->withCount('categories')
                ->orderBy('name')
                ->get(['major_service_category_ID', 'name', 'description']),
            'can' => [
                'manage_major_service_categories' => $request->user()?->can(
                    'create',
                    MajorServiceCategory::class,
                ) ?? false,
            ],
            'summary' => fn (): array => $this->categoryService->statistics(),
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $this->categoryService->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Category created successfully.']);

        return back();
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $this->categoryService->update($category, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Category updated successfully.']);

        return back();
    }

    public function destroy(Category $category): RedirectResponse
    {
        Gate::authorize('delete', $category);

        $this->categoryService->delete($category);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Category deleted successfully.']);

        return back();
    }

    /** @return array<string, array<string, int|string>|int|string|null> */
    private function serializeCategory(Category $category): array
    {
        return [
            ...app(\App\Services\NewRecordService::class)->metadata($category),
            'category_ID' => $category->category_ID,
            'category_name' => $category->category_name,
            'category_type' => $category->category_type,
            'major_service_category_ID' => $category->major_service_category_ID,
            'major_service_category' => $category->majorServiceCategory === null
                ? null
                : [
                    'major_service_category_ID' => $category->majorServiceCategory->major_service_category_ID,
                    'name' => $category->majorServiceCategory->name,
                ],
            'description' => $category->description,
            'created_at' => $category->created_at?->toISOString(),
        ];
    }
}
