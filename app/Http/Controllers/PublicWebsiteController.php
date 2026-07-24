<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\MajorServiceCategory;
use App\Models\Service;
use App\Models\SystemSetting;
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
            'branches' => $this->branchCards(4),
            'contactBranches' => $this->branchCards(),
            'stats' => [
                'years_experience' => max(now()->year - $settings->landing_year_started, 0),
                'branch_count' => Branch::query()->count(),
                'service_count' => Service::query()->count(),
            ],
        ]);
    }

    public function services(): Response
    {
        return Inertia::render('public/services', [
            'settings' => SystemSetting::current()->toPublicArray(),
            'services' => $this->serviceCards(),
            'majorCategories' => MajorServiceCategory::query()
                ->orderBy('name')
                ->pluck('name')
                ->all(),
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
        return Service::query()
            ->select(['service_ID', 'category_ID', 'name', 'description', 'service_img'])
            ->with([
                'category:category_ID,category_name,major_service_category_ID',
                'category.majorServiceCategory:major_service_category_ID,name',
            ])
            ->whereHas('category', fn ($query) => $query->where('category_name', '!=', 'Consultations'))
            ->orderBy('name')
            ->when($limit, fn ($query, int $count) => $query->limit($count))
            ->get()
            ->map(fn (Service $service): array => [
                'id' => $service->service_ID,
                'name' => $service->name,
                'description' => $service->description,
                'category' => $service->category?->category_name,
                'major_category' => $service->category?->majorServiceCategory?->name,
                'image_url' => $service->service_img === null
                    ? null
                    : Storage::disk('public')->url($service->service_img),
            ])
            ->all();
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
