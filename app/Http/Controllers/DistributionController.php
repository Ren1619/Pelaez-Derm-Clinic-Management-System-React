<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDistributionRequest;
use App\Models\Branch;
use App\Models\Distribution;
use App\Models\Product;
use App\Models\StaffAccount;
use App\Services\DistributionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DistributionController extends Controller
{
    public function __construct(private DistributionService $distributionService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Distribution::class);

        $tab = $request->string('tab')->toString() === 'inbound' ? 'inbound' : 'outbound';
        $search = $request->string('search')->squish()->toString();
        $requestedPerPage = $request->integer('per_page', 10);
        $perPage = in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10;
        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $requestedBranchId = $request->integer('branch_ID');
        $branchId = $canViewAllBranches
            ? ($requestedBranchId > 0 && Branch::query()->whereKey($requestedBranchId)->exists() ? $requestedBranchId : null)
            : $user->branch_ID;

        $query = $this->visibleQuery($tab, $branchId, $search)
            ->with([
                'fromBranch:branch_ID,branch_name',
                'toBranch:branch_ID,branch_name',
                'createdBy:account_ID,first_name,middle_name,last_name',
                'items',
            ]);

        $distributions = $query
            ->latest('created_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Distribution $distribution): array => $this->serializeDistribution($distribution));

        $canCreate = Gate::allows('create', Distribution::class);
        $productBranchId = $canViewAllBranches ? null : $branchId;

        return Inertia::render('distributions/index', [
            'distributions' => $distributions,
            'filters' => [
                'tab' => $tab,
                'search' => $search,
                'branch_ID' => $branchId,
                'per_page' => $perPage,
            ],
            'counts' => [
                'outbound' => $this->visibleQuery('outbound', $branchId, '')->count(),
                'inbound' => $this->visibleQuery('inbound', $branchId, '')->count(),
                'pending_outbound' => $this->visibleQuery('outbound', $branchId, '')
                    ->whereIn('status', [Distribution::Pending, Distribution::InTransit])
                    ->count(),
                'pending_inbound' => $this->visibleQuery('inbound', $branchId, '')
                    ->where('status', Distribution::InTransit)
                    ->count(),
            ],
            'branches' => Branch::query()
                ->orderBy('branch_name')
                ->get(['branch_ID', 'branch_name']),
            'availableProducts' => $canCreate
                ? Product::query()
                    ->with('category:category_ID,category_name')
                    ->when($productBranchId, fn (Builder $query, int $selectedBranchId) => $query->where('branch_ID', $selectedBranchId))
                    ->where('quantity', '>', 0)
                    ->where(fn (Builder $query) => $query->whereNull('expiration_date')->orWhereDate('expiration_date', '>=', today()))
                    ->orderBy('name')
                    ->orderBy('expiration_date')
                    ->get()
                    ->map(fn (Product $product): array => [
                        'product_ID' => $product->product_ID,
                        'branch_ID' => $product->branch_ID,
                        'name' => $product->name,
                        'category_name' => $product->category->category_name,
                        'measurement_unit' => $product->measurement_unit,
                        'quantity' => $product->quantity,
                        'price' => $product->price,
                        'expiration_date' => $product->expiration_date?->toDateString(),
                    ])
                : [],
            'canCreate' => $canCreate,
            'canViewAllBranches' => $canViewAllBranches,
            'currentBranchId' => $user instanceof StaffAccount ? $user->branch_ID : null,
        ]);
    }

    public function store(StoreDistributionRequest $request): RedirectResponse
    {
        $creator = $request->user();
        $this->distributionService->create(
            $request->validated(),
            $creator instanceof StaffAccount ? $creator : null,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Distribution scheduled successfully.']);

        return back();
    }

    public function destroy(Distribution $distribution): RedirectResponse
    {
        Gate::authorize('delete', $distribution);
        $distribution->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Distribution record deleted.']);

        return back();
    }

    /** @return Builder<Distribution> */
    private function visibleQuery(string $tab, ?int $branchId, string $search): Builder
    {
        $branchColumn = $tab === 'inbound' ? 'to_branch_ID' : 'from_branch_ID';

        return Distribution::query()
            ->when($branchId, fn (Builder $query, int $selectedBranchId) => $query->where($branchColumn, $selectedBranchId))
            ->when($search, fn (Builder $query, string $searchTerm) => $query->where(function (Builder $searchQuery) use ($searchTerm): void {
                $searchQuery
                    ->whereHas('fromBranch', fn (Builder $branchQuery) => $branchQuery->where('branch_name', 'like', "%{$searchTerm}%"))
                    ->orWhereHas('toBranch', fn (Builder $branchQuery) => $branchQuery->where('branch_name', 'like', "%{$searchTerm}%"));

                if (ctype_digit($searchTerm)) {
                    $searchQuery->orWhereKey((int) $searchTerm);
                }
            }));
    }

    /** @return array<string, mixed> */
    private function serializeDistribution(Distribution $distribution): array
    {
        return [
            ...app(\App\Services\NewRecordService::class)->metadata($distribution),
            'distribution_ID' => $distribution->distribution_ID,
            'status' => $distribution->status,
            'from_branch' => $distribution->fromBranch,
            'to_branch' => $distribution->toBranch,
            'created_by' => $distribution->createdBy?->full_name,
            'scheduled_date' => $distribution->scheduled_date?->toISOString(),
            'sent_date' => $distribution->sent_date?->toISOString(),
            'received_date' => $distribution->received_date?->toISOString(),
            'created_at' => $distribution->created_at?->toISOString(),
            'notes' => $distribution->notes,
            'cancellation_reason' => $distribution->cancellation_reason,
            'total_quantity' => $distribution->items->sum('quantity'),
            'items' => $distribution->items->map(fn ($item): array => [
                'distribution_item_ID' => $item->distribution_item_ID,
                'product_name' => $item->product_name,
                'category_name' => $item->category_name,
                'measurement_unit' => $item->measurement_unit,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'expiration_date' => $item->expiration_date?->toDateString(),
            ]),
            'can' => [
                'send' => Gate::allows('send', $distribution),
                'receive' => Gate::allows('receive', $distribution),
                'cancel' => Gate::allows('cancel', $distribution),
                'delete' => Gate::allows('delete', $distribution),
            ],
        ];
    }
}
