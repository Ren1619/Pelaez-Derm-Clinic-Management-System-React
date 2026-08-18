<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\MajorServiceCategory;
use App\Models\Service;
use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicWebsiteController extends Controller
{
    public function home(): Response
    {
        $settings = SystemSetting::current();

        return Inertia::render('welcome', [
            'settings' => $settings->toPublicArray(),
            'services' => $this->serviceCards(),
            'serviceCategories' => MajorServiceCategory::query()
                ->orderBy('name')
                ->pluck('name')
                ->all(),
            'branches' => $this->branchCards(3),
            'contactBranches' => $this->branchCards(),
            'stats' => [
                'years_experience' => max(now()->year - $settings->landing_year_started, 0),
                'branch_count' => Branch::query()->count(),
                'service_count' => Service::query()->count(),
            ],
        ]);
    }

    public function services(Request $request): Response
    {
        $majorCategory = $request->string('major_category')->trim()->toString() ?: null;
        $category = $request->string('category')->trim()->toString() ?: null;

        return Inertia::render('public/services', [
            'settings' => SystemSetting::current()->toPublicArray(),
            'services' => Inertia::scroll(
                fn () => $this->paginatedServiceCards($majorCategory, $category),
            ),
            'majorCategories' => $this->serviceCategoryFilters(),
            'filters' => [
                'major_category' => $majorCategory,
                'category' => $category,
            ],
        ]);
    }

    public function branches(): Response
    {
        return Inertia::render('public/branches', [
            'settings' => SystemSetting::current()->toPublicArray(),
            'branches' => $this->branchCards(),
        ]);
    }

    public function privacyNotice(): Response
    {
        return Inertia::render('public/privacy-notice', [
            'settings' => SystemSetting::current()->toPublicArray(),
        ]);
    }

    /** @return list<array<string, mixed>> */
    private function serviceCards(?int $limit = null): array
    {
        return $this->serviceCardQuery()
            ->when($limit, fn ($query, int $count) => $query->limit($count))
            ->get()
            ->map(fn (Service $service): array => $this->serviceCard($service))
            ->all();
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    private function paginatedServiceCards(
        ?string $majorCategory,
        ?string $category,
    ): LengthAwarePaginator {
        return $this->serviceCardQuery()
            ->when(
                $majorCategory,
                fn (Builder $query, string $name) => $query->whereHas(
                    'category.majorServiceCategory',
                    fn (Builder $query) => $query->where('name', $name),
                ),
            )
            ->when(
                $category,
                fn (Builder $query, string $name) => $query->whereHas(
                    'category',
                    fn (Builder $query) => $query->where('category_name', $name),
                ),
            )
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Service $service): array => $this->serviceCard($service));
    }

    /**
     * @return list<array{
     *     name: string,
     *     count: int,
     *     categories: list<array{name: string, count: int}>
     * }>
     */
    private function serviceCategoryFilters(): array
    {
        return MajorServiceCategory::query()
            ->select(['major_service_category_ID', 'name'])
            ->with([
                'categories' => fn ($query) => $query
                    ->select([
                        'category_ID',
                        'major_service_category_ID',
                        'category_name',
                    ])
                    ->where('category_name', '!=', 'Consultations')
                    ->whereHas('services')
                    ->withCount('services')
                    ->orderBy('category_name'),
            ])
            ->orderBy('name')
            ->get()
            ->map(function (MajorServiceCategory $majorCategory): array {
                $categories = $majorCategory->categories
                    ->map(fn (Category $category): array => [
                        'name' => $category->category_name,
                        'count' => $category->services_count,
                    ])
                    ->values();

                return [
                    'name' => $majorCategory->name,
                    'count' => $categories->sum('count'),
                    'categories' => $categories->all(),
                ];
            })
            ->values()
            ->all();
    }

    /** @return Builder<Service> */
    private function serviceCardQuery(): Builder
    {
        return Service::query()
            ->select(['service_ID', 'category_ID', 'name', 'description', 'service_img'])
            ->with([
                'category:category_ID,category_name,major_service_category_ID',
                'category.majorServiceCategory:major_service_category_ID,name',
            ])
            ->whereHas('category', fn (Builder $query) => $query->where('category_name', '!=', 'Consultations'))
            ->orderBy('name');
    }

    /** @return array<string, mixed> */
    private function serviceCard(Service $service): array
    {
        return [
            'id' => $service->service_ID,
            'name' => $service->name,
            'description' => $service->description,
            'category' => $service->category?->category_name,
            'major_category' => $service->category?->majorServiceCategory?->name,
            'image_url' => $service->service_img === null
                ? null
                : Storage::disk('public')->url($service->service_img),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function branchCards(?int $limit = null): array
    {
        return Branch::query()
            ->select([
                'branch_ID',
                'branch_name',
                'branch_location',
                'latitude',
                'longitude',
                'contact_number',
                'map_link',
                'fb_link',
                'branch_img',
            ])
            ->orderBy('branch_name')
            ->when($limit, fn ($query, int $count) => $query->limit($count))
            ->get()
            ->map(fn (Branch $branch): array => [
                'id' => $branch->branch_ID,
                'name' => $branch->branch_name,
                'location' => $branch->branch_location,
                'latitude' => $branch->latitude,
                'longitude' => $branch->longitude,
                'contact_number' => $branch->contact_number,
                'map_link' => $branch->map_link,
                'facebook_link' => $branch->fb_link,
                'image_url' => $branch->branch_img === null
                    ? null
                    : "/storage/{$branch->branch_img}",
            ])
            ->all();
    }
}
