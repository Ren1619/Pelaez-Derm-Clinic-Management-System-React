<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Models\Branch;
use App\Services\BranchService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function __construct(private BranchService $branchService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Branch::class);

        $search = $request->string('search')->squish()->toString();
        $requestedPerPage = $request->integer('per_page', 10);
        $perPage = in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10;

        $branches = Branch::query()
            ->select([
                'branch_ID',
                'branch_name',
                'branch_location',
                'contact_number',
                'map_link',
                'fb_link',
                'branch_img',
                'created_at',
            ])
            ->when($search, fn (Builder $query, string $searchTerm) => $query->where(
                fn (Builder $branchQuery) => $branchQuery
                    ->where('branch_name', 'like', "%{$searchTerm}%")
                    ->orWhere('branch_location', 'like', "%{$searchTerm}%"),
            ))
            ->orderBy('branch_name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Branch $branch): array => $this->serializeBranch($branch));

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'totalBranches' => fn (): int => Branch::count(),
        ]);
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $this->branchService->create(
            $request->safe()->except('branch_img'),
            $request->file('branch_img'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Branch created successfully.']);

        return back();
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $this->branchService->update(
            $branch,
            $request->safe()->except('branch_img'),
            $request->file('branch_img'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Branch updated successfully.']);

        return back();
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        Gate::authorize('delete', $branch);

        $this->branchService->delete($branch);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Branch deleted successfully.']);

        return back();
    }

    /** @return array<string, int|string|null> */
    private function serializeBranch(Branch $branch): array
    {
        return [
            'branch_ID' => $branch->branch_ID,
            'branch_name' => $branch->branch_name,
            'branch_location' => $branch->branch_location,
            'contact_number' => $branch->contact_number,
            'map_link' => $branch->map_link,
            'fb_link' => $branch->fb_link,
            'branch_img' => $branch->branch_img,
            'image_url' => $branch->branch_img === null ? null : Storage::disk('public')->url($branch->branch_img),
            'created_at' => $branch->created_at?->toISOString(),
        ];
    }
}
