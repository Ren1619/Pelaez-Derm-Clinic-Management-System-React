<?php

namespace App\Http\Controllers;

use App\Http\Requests\RestockProductRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\StaffAccount;
use App\Services\InventoryManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(private InventoryManagementService $inventoryManagementService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $status = in_array($request->string('status')->toString(), [
            'in-stock',
            'low-stock',
            'out-of-stock',
            'expiring',
            'expired',
        ], true) ? $request->string('status')->toString() : 'in-stock';
        $view = in_array($request->string('view')->toString(), ['grouped', 'detailed'], true)
            ? $request->string('view')->toString()
            : 'grouped';
        $search = $request->string('search')->squish()->toString();
        $requestedPerPage = $request->integer('per_page', 10);
        $perPage = in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10;
        $requestedBranchId = $request->integer('branch_ID');
        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $branchId = $canViewAllBranches
            ? ($requestedBranchId > 0 && Branch::query()->whereKey($requestedBranchId)->exists()
                ? $requestedBranchId
                : null)
            : $user->branch_ID;

        return Inertia::render('inventory/index', [
            'inventory' => $this->inventoryManagementService->paginate(
                $status,
                $view,
                $search,
                $branchId,
                $perPage,
            ),
            'filters' => [
                'status' => $status,
                'view' => $view,
                'search' => $search,
                'branch_ID' => $branchId,
                'per_page' => $perPage,
            ],
            'statistics' => fn (): array => $this->inventoryManagementService->statistics($branchId),
            'branches' => Branch::query()
                ->when(! $canViewAllBranches, fn ($query) => $query->whereKey($branchId))
                ->orderBy('branch_name')
                ->get(['branch_ID', 'branch_name']),
            'mainBranch' => Branch::query()
                ->whereKey(1)
                ->first(['branch_ID', 'branch_name']),
            'categories' => Category::query()
                ->where('category_type', 'Product')
                ->orderBy('category_name')
                ->get(['category_ID', 'category_name']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $result = $this->inventoryManagementService->createOrMergeBatch(
            $request->safe()->except('new_image'),
            $request->file('new_image'),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $result['merged']
                ? 'Quantity added to the existing product batch.'
                : 'Product batch created successfully.',
        ]);

        return back();
    }

    public function restock(RestockProductRequest $request, Product $product): RedirectResponse
    {
        $result = $this->inventoryManagementService->restock(
            $product,
            $request->safe()->except('new_image'),
            $request->file('new_image'),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $result['merged']
                ? 'Quantity added to the matching product batch.'
                : 'Product restocked with a new batch.',
        ]);

        return back();
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->inventoryManagementService->update(
            $product,
            $request->safe()->except('new_image'),
            $request->file('new_image'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product batch updated successfully.']);

        return back();
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        $this->inventoryManagementService->delete($product);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product batch deleted successfully.']);

        return back();
    }
}
