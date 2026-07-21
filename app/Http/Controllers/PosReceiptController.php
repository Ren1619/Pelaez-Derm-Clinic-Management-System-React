<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\POS\PointOfSalePageService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PosReceiptController extends Controller
{
    public function __construct(private PointOfSalePageService $pointOfSalePageService) {}

    public function __invoke(Sale $sale): Response
    {
        Gate::authorize('view', $sale);

        return Inertia::render('pos/receipt', ['sale' => $this->pointOfSalePageService->receipt($sale)]);
    }
}
