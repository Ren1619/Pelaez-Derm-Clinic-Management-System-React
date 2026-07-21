<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\StaffAccount;
use App\Services\POS\PointOfSalePageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PointOfSaleController extends Controller
{
    public function __construct(private PointOfSalePageService $pointOfSalePageService) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Sale::class);

        $validated = $request->validate([
            'branch_ID' => ['nullable', 'integer', Rule::exists((new Branch)->getTable(), 'branch_ID')],
            'sales_date' => ['nullable', 'date'],
            'expense_month' => ['nullable', 'integer', 'between:1,12'],
            'expense_year' => ['nullable', 'integer', 'between:2000,2100'],
        ]);
        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $branchId = $canViewAllBranches
            ? (int) ($validated['branch_ID'] ?? Branch::query()->orderBy('branch_ID')->value('branch_ID') ?? 0)
            : (int) $user->branch_ID;

        abort_if($branchId === 0, 403, 'A clinic branch must be assigned to use Point of Sale.');

        return Inertia::render('pos/index', $this->pointOfSalePageService->payload(
            $branchId,
            $validated['sales_date'] ?? today()->toDateString(),
            (int) ($validated['expense_month'] ?? now()->month),
            (int) ($validated['expense_year'] ?? now()->year),
            $canViewAllBranches,
        ));
    }
}
