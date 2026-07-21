<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Service;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicWebsiteController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('welcome', [
            'settings' => SystemSetting::current()->toPublicArray(),
            'services' => $this->serviceCards(6),
            'branches' => $this->branchCards(4),
        ]);
    }

    public function services(): Response
    {
        return Inertia::render('public/services', [
            'settings' => SystemSetting::current()->toPublicArray(),
            'services' => $this->serviceCards(),
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
            ->with('category:category_ID,category_name')
            ->orderBy('name')
            ->when($limit, fn ($query, int $count) => $query->limit($count))
            ->get()
            ->map(fn (Service $service): array => [
                'id' => $service->service_ID,
                'name' => $service->name,
                'description' => $service->description,
                'category' => $service->category?->category_name,
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
            ->orderBy('branch_name')
            ->when($limit, fn ($query, int $count) => $query->limit($count))
            ->get()
            ->map(fn (Branch $branch): array => [
                'id' => $branch->branch_ID,
                'name' => $branch->branch_name,
                'location' => $branch->branch_location,
                'contact_number' => $branch->contact_number,
                'map_link' => $branch->map_link,
                'facebook_link' => $branch->fb_link,
                'image_url' => $branch->branch_img === null
                    ? null
                    : Storage::disk('public')->url($branch->branch_img),
            ])
            ->all();
    }
}
