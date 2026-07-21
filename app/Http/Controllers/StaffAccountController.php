<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffAccountRequest;
use App\Http\Requests\UpdateStaffAccountRequest;
use App\Models\AccountRole;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Services\StaffAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StaffAccountController extends Controller
{
    public function __construct(private StaffAccountService $staffAccountService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', StaffAccount::class);

        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $filters = $this->filters($request);
        $filters['branch_ID'] = $canViewAllBranches ? $filters['branch_ID'] : $user->branch_ID;
        $summaryBranchId = $canViewAllBranches ? null : $filters['branch_ID'];
        $staffAccounts = $this->staffAccountService
            ->paginate($filters)
            ->through(fn (StaffAccount $staffAccount): array => $this->serializeStaffAccount($staffAccount));

        return Inertia::render('staff/index', [
            'staffAccounts' => $staffAccounts,
            'filters' => $filters,
            'branches' => Branch::query()
                ->when(! $canViewAllBranches, fn ($query) => $query->whereKey($user->branch_ID))
                ->select(['branch_ID', 'branch_name'])
                ->orderBy('branch_name')
                ->get(),
            'roles' => AccountRole::query()
                ->when(! $canViewAllBranches, fn ($query) => $query->where('role_name', '!=', 'super_admin'))
                ->select(['role_ID', 'role_name'])
                ->orderBy('role_ID')
                ->get(),
            'summary' => [
                'total' => StaffAccount::query()
                    ->when($summaryBranchId, fn ($query, int $branchId) => $query->where('branch_ID', $branchId))
                    ->count(),
                'active' => StaffAccount::query()
                    ->when($summaryBranchId, fn ($query, int $branchId) => $query->where('branch_ID', $branchId))
                    ->where('is_active', true)
                    ->count(),
                'unverified' => StaffAccount::query()
                    ->when($summaryBranchId, fn ($query, int $branchId) => $query->where('branch_ID', $branchId))
                    ->whereNull('email_verified_at')
                    ->count(),
            ],
        ]);
    }

    public function store(StoreStaffAccountRequest $request): RedirectResponse
    {
        $this->staffAccountService->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Staff account created and verification email queued.',
        ]);

        return back();
    }

    public function update(UpdateStaffAccountRequest $request, StaffAccount $staffAccount): RedirectResponse
    {
        $emailChanged = $staffAccount->email !== $request->validated('email');

        $this->staffAccountService->update($staffAccount, $request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $emailChanged
                ? 'Staff account updated and a new verification email queued.'
                : 'Staff account updated successfully.',
        ]);

        return back();
    }

    public function toggleStatus(StaffAccount $staffAccount): RedirectResponse
    {
        Gate::authorize('update', $staffAccount);

        $staffAccount = $this->staffAccountService->toggleStatus($staffAccount);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $staffAccount->is_active
                ? 'Staff account enabled successfully.'
                : 'Staff account disabled successfully.',
        ]);

        return back();
    }

    /**
     * @return array{search: string, branch_ID: int|null, role_ID: int|null, verification: string|null, status: string|null, per_page: int}
     */
    private function filters(Request $request): array
    {
        $requestedPerPage = $request->integer('per_page', 10);
        $verification = $request->string('verification')->toString();
        $status = $request->string('status')->toString();

        return [
            'search' => $request->string('search')->squish()->toString(),
            'branch_ID' => $request->integer('branch_ID') ?: null,
            'role_ID' => $request->integer('role_ID') ?: null,
            'verification' => in_array($verification, ['verified', 'unverified'], true) ? $verification : null,
            'status' => in_array($status, ['active', 'inactive'], true) ? $status : null,
            'per_page' => in_array($requestedPerPage, [10, 25, 50], true) ? $requestedPerPage : 10,
        ];
    }

    /** @return array<string, bool|int|string|null|array<string, int|string>> */
    private function serializeStaffAccount(StaffAccount $staffAccount): array
    {
        return [
            'account_ID' => $staffAccount->account_ID,
            'branch_ID' => $staffAccount->branch_ID,
            'role_ID' => $staffAccount->role_ID,
            'first_name' => $staffAccount->first_name,
            'middle_name' => $staffAccount->middle_name,
            'last_name' => $staffAccount->last_name,
            'full_name' => $staffAccount->full_name,
            'contact_number' => $staffAccount->contact_number,
            'email' => $staffAccount->email,
            'email_verified_at' => $staffAccount->email_verified_at?->toISOString(),
            'is_active' => $staffAccount->is_active,
            'created_at' => $staffAccount->created_at?->toISOString(),
            'branch' => $staffAccount->branch === null ? null : [
                'branch_ID' => $staffAccount->branch->branch_ID,
                'branch_name' => $staffAccount->branch->branch_name,
            ],
            'role' => [
                'role_ID' => $staffAccount->role->role_ID,
                'role_name' => $staffAccount->role->role_name,
            ],
        ];
    }
}
