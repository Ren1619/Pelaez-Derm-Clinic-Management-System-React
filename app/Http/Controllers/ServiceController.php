<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Category;
use App\Models\Service;
use App\Services\ServiceManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(private ServiceManagementService $serviceManagementService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Service::class);

        $search = $request->string('search')->squish()->toString();
        $requestedPerPage = $request->integer('per_page', 10);
        $perPage = in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10;

        return Inertia::render('services/index', [
            'services' => $this->serviceManagementService
                ->paginate($search, $perPage)
                ->through(fn (Service $service): array => $this->serializeService($service)),
            'categories' => Category::query()
                ->where('category_type', 'Service')
                ->with('majorServiceCategory:major_service_category_ID,name')
                ->orderBy('major_service_category_ID')
                ->orderBy('category_name')
                ->get(['category_ID', 'category_name', 'major_service_category_ID'])
                ->map(fn (Category $category): array => [
                    'category_ID' => $category->category_ID,
                    'category_name' => $category->category_name,
                    'major_service_category' => [
                        'major_service_category_ID' => $category->majorServiceCategory->major_service_category_ID,
                        'name' => $category->majorServiceCategory->name,
                    ],
                ]),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'totalServices' => fn (): int => Service::count(),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $this->serviceManagementService->create(
            $request->safe()->except('new_image'),
            $request->file('new_image'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Service created successfully.']);

        return back();
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $this->serviceManagementService->update(
            $service,
            $request->safe()->except('new_image'),
            $request->file('new_image'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Service updated successfully.']);

        return back();
    }

    public function destroy(Service $service): RedirectResponse
    {
        Gate::authorize('delete', $service);

        $this->serviceManagementService->delete($service);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Service deleted successfully.']);

        return back();
    }

    /** @return array<string, array<string, int|string>|int|string|null> */
    private function serializeService(Service $service): array
    {
        return [
            ...app(\App\Services\NewRecordService::class)->metadata($service),
            'service_ID' => $service->service_ID,
            'category_ID' => $service->category_ID,
            'name' => $service->name,
            'description' => $service->description,
            'service_img' => $service->service_img,
            'image_url' => $service->service_img === null
                ? null
                : Storage::disk('public')->url($service->service_img),
            'category' => [
                'category_ID' => $service->category->category_ID,
                'category_name' => $service->category->category_name,
                'major_service_category' => [
                    'major_service_category_ID' => $service->category->majorServiceCategory->major_service_category_ID,
                    'name' => $service->category->majorServiceCategory->name,
                ],
            ],
            'created_at' => $service->created_at?->toISOString(),
        ];
    }
}
