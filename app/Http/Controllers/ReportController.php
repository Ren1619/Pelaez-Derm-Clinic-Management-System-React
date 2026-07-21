<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Services\ReportsService;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private ReportsService $reportsService) {}

    public function index(ReportFilterRequest $request): Response
    {
        $filters = $this->filters($request);
        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $branchId = $canViewAllBranches
            ? (int) ($filters['branch_ID'] ?? Branch::query()->orderBy('branch_ID')->value('branch_ID') ?? 0)
            : (int) $user->branch_ID;

        abort_if($branchId === 0, 403, 'A clinic branch must be assigned to view reports.');
        $filters['branch_ID'] = $branchId;

        return Inertia::render('reports/index', [
            'analytics' => fn (): array => $this->reportsService->analytics(
                $filters['summary_period'],
                $canViewAllBranches ? null : $branchId,
                $canViewAllBranches,
                $filters['comparison_period'],
                $filters['anonymize'],
            ),
            'branchSales' => fn (): array => $this->reportsService->branchSales($branchId, $filters),
            'branches' => Branch::query()
                ->when(! $canViewAllBranches, fn ($query) => $query->whereKey($branchId))
                ->orderBy('branch_name')
                ->get(['branch_ID', 'branch_name']),
            'currentBranch' => Branch::query()->find($branchId, ['branch_ID', 'branch_name']),
            'filters' => $filters,
            'canViewAllBranches' => $canViewAllBranches,
        ]);
    }

    /** @return array<string, mixed> */
    private function filters(ReportFilterRequest $request): array
    {
        $validated = $request->validated();

        return [
            'summary_period' => $validated['summary_period'] ?? 'this_month',
            'comparison_period' => $validated['comparison_period'] ?? 'month',
            'branch_ID' => $validated['branch_ID'] ?? null,
            'sales_period' => $validated['sales_period'] ?? 'month',
            'specific_date' => $validated['specific_date'] ?? null,
            'custom_start_date' => $validated['custom_start_date'] ?? null,
            'custom_end_date' => $validated['custom_end_date'] ?? null,
            'search' => isset($validated['search']) ? str($validated['search'])->squish()->toString() : '',
            'per_page' => $validated['per_page'] ?? 10,
            'anonymize' => (bool) ($validated['anonymize'] ?? false),
        ];
    }
}
