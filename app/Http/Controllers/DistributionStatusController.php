<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelDistributionRequest;
use App\Models\Distribution;
use App\Services\DistributionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DistributionStatusController extends Controller
{
    public function __construct(private DistributionService $distributionService) {}

    public function send(Distribution $distribution): RedirectResponse
    {
        Gate::authorize('send', $distribution);
        $this->distributionService->send($distribution);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Distribution marked as in transit.']);

        return back();
    }

    public function receive(Distribution $distribution): RedirectResponse
    {
        Gate::authorize('receive', $distribution);
        $this->distributionService->receive($distribution);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Distribution received and inventory updated.']);

        return back();
    }

    public function cancel(CancelDistributionRequest $request, Distribution $distribution): RedirectResponse
    {
        $this->distributionService->cancel($distribution, $request->string('cancellation_reason')->toString());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Distribution cancelled.']);

        return back();
    }
}
