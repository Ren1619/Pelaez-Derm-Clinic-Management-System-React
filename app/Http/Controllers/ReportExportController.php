<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Services\ReportsService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function __construct(private ReportsService $reportsService) {}

    public function __invoke(ReportFilterRequest $request): StreamedResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $branchId = $canViewAllBranches
            ? (int) ($validated['branch_ID'] ?? Branch::query()->orderBy('branch_ID')->value('branch_ID') ?? 0)
            : (int) $user->branch_ID;
        abort_if($branchId === 0, 403, 'A clinic branch must be assigned to export reports.');
        $branch = Branch::query()->findOrFail($branchId);
        $filters = [
            'sales_period' => $validated['sales_period'] ?? 'month',
            'specific_date' => $validated['specific_date'] ?? null,
            'custom_start_date' => $validated['custom_start_date'] ?? null,
            'custom_end_date' => $validated['custom_end_date'] ?? null,
            'search' => isset($validated['search']) ? str($validated['search'])->squish()->toString() : '',
        ];

        return response()->streamDownload(function () use ($branchId, $filters): void {
            $stream = fopen('php://output', 'wb');

            if ($stream === false) {
                return;
            }

            fputcsv($stream, ['Invoice', 'Date', 'Customer', 'Status', 'Subtotal', 'Discount', 'Total', 'Returned', 'Net', 'Payment']);

            foreach ($this->reportsService->exportQuery($branchId, $filters)->cursor() as $sale) {
                $returned = (float) ($sale->returned_amount ?? 0);
                fputcsv($stream, [
                    $this->csvValue($sale->invoice_number),
                    $sale->created_at?->format('Y-m-d H:i:s'),
                    $this->csvValue($sale->customer_name),
                    $sale->is_voided ? 'Voided' : ($returned > 0 ? 'Returned' : 'Complete'),
                    $sale->subtotal_cost,
                    $sale->discount_amount,
                    $sale->total_cost,
                    number_format($returned, 2, '.', ''),
                    number_format($sale->is_voided ? 0 : max(0, (float) $sale->total_cost - $returned), 2, '.', ''),
                    $sale->pay_method,
                ]);
            }

            fclose($stream);
        }, $this->reportsService->exportFilename($branch, $filters), ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function csvValue(string $value): string
    {
        return preg_match('/^[=+\-@]/', $value) === 1 ? "'{$value}" : $value;
    }
}
