<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutSaleRequest;
use App\Models\StaffAccount;
use App\Models\User;
use App\Services\POS\ProcessSaleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class PosCheckoutController extends Controller
{
    public function __construct(private ProcessSaleService $processSaleService) {}

    public function __invoke(CheckoutSaleRequest $request): RedirectResponse
    {
        /** @var StaffAccount|User $user */
        $user = $request->user();
        $sale = $this->processSaleService->create($request->validated(), $user);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Sale {$sale->invoice_number} completed successfully."]);
        Inertia::flash('completedSale', ['sale_ID' => $sale->sale_ID, 'invoice_number' => $sale->invoice_number]);

        return back();
    }
}
