<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReturnSaleRequest;
use App\Http\Requests\VoidSaleRequest;
use App\Models\Sale;
use App\Models\StaffAccount;
use App\Models\User;
use App\Services\POS\ProcessSaleReturnService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class PosSaleReturnController extends Controller
{
    public function __construct(private ProcessSaleReturnService $processSaleReturnService) {}

    public function void(VoidSaleRequest $request, Sale $sale): RedirectResponse
    {
        /** @var StaffAccount|User $user */
        $user = $request->user();
        $return = $this->processSaleReturnService->void($sale, $request->validated(), $user);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Sale voided. Refund: ₱{$return->return_amount}."]);

        return back();
    }

    public function store(ReturnSaleRequest $request, Sale $sale): RedirectResponse
    {
        /** @var StaffAccount|User $user */
        $user = $request->user();
        $return = $this->processSaleReturnService->partial($sale, $request->validated(), $user);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Partial return completed. Refund: ₱{$return->return_amount}."]);

        return back();
    }
}
