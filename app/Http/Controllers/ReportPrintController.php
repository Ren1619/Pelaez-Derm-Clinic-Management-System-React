<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Services\ReportsService;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Str;

class ReportPrintController extends Controller
{
    public function __construct(private ReportsService $reportsService) {}

    public function sales(ReportFilterRequest $request, string $reportPeriod): View
    {
        $branchId = $this->authorizedBranchId($request, false);
        $branch = $branchId === null ? null : Branch::query()->findOrFail($branchId);
        $report = $this->reportsService->printableReport(
            $branchId,
            $this->reportsService->standardSalesFilters($reportPeriod),
        );

        return $this->view(
            Str::upper($reportPeriod).' SALES REPORT',
            $branch === null ? 'All Clinics' : $branch->branch_name.' Branch',
            $report,
        );
    }

    public function branchSales(ReportFilterRequest $request): View
    {
        $validated = $request->validated();
        $branchId = $this->authorizedBranchId($request, true);
        abort_if($branchId === null, 403, 'A clinic branch must be assigned to print this report.');
        $branch = Branch::query()->findOrFail($branchId);
        $report = $this->reportsService->printableReport($branchId, [
            'sales_period' => $validated['sales_period'] ?? 'month',
            'specific_date' => $validated['specific_date'] ?? null,
            'custom_start_date' => $validated['custom_start_date'] ?? null,
            'custom_end_date' => $validated['custom_end_date'] ?? null,
            'search' => isset($validated['search']) ? str($validated['search'])->squish()->toString() : '',
        ]);

        return $this->view('BRANCH SALES REPORT', $branch->branch_name.' Branch', $report);
    }

    private function authorizedBranchId(ReportFilterRequest $request, bool $useDefaultBranch): ?int
    {
        $user = $request->user();

        if ($user instanceof StaffAccount && ! $user->isSuperAdmin()) {
            return (int) $user->branch_ID;
        }

        $requestedBranchId = $request->validated('branch_ID');

        if ($requestedBranchId !== null) {
            return (int) $requestedBranchId;
        }

        if (! $useDefaultBranch) {
            return null;
        }

        $defaultBranchId = Branch::query()->orderBy('branch_ID')->value('branch_ID');

        return $defaultBranchId === null ? null : (int) $defaultBranchId;
    }

    /** @param array<string, mixed> $report */
    private function view(string $title, string $scopeLabel, array $report): View
    {
        return view('reports.sales-print', [
            'title' => $title,
            'scopeLabel' => $scopeLabel,
            'periodLabel' => $report['period_label'],
            'stats' => $report['stats'],
            'sales' => $report['sales'],
            'backUrl' => route('reports.index'),
            'generatedAt' => now()->format('F j, Y g:i A'),
        ]);
    }
}
