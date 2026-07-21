<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterFeedbackRequest;
use App\Models\Feedback;
use App\Models\StaffAccount;
use App\Services\FeedbackService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    public function __construct(private FeedbackService $feedbackService) {}

    public function index(FilterFeedbackRequest $request): Response
    {
        Gate::authorize('viewAny', Feedback::class);
        $validated = $request->validated();
        $allDates = (bool) ($validated['all_dates'] ?? false);
        $hasCustomDates = array_key_exists('date_from', $validated) || array_key_exists('date_to', $validated);
        $user = $request->user();
        $canViewAllBranches = ! ($user instanceof StaffAccount) || $user->isSuperAdmin();
        $filters = [
            'search' => $validated['search'] ?? '',
            'date_from' => $allDates ? null : ($validated['date_from'] ?? ($hasCustomDates ? null : now()->startOfMonth()->toDateString())),
            'date_to' => $allDates ? null : ($validated['date_to'] ?? ($hasCustomDates ? null : now()->endOfMonth()->toDateString())),
            'all_dates' => $allDates,
            'rating' => isset($validated['rating']) ? (int) $validated['rating'] : null,
            'appointment_type' => $validated['appointment_type'] ?? 'all',
            'branch_ID' => $canViewAllBranches
                ? (isset($validated['branch_ID']) ? (int) $validated['branch_ID'] : null)
                : $user->branch_ID,
            'can_view_all_branches' => $canViewAllBranches,
            'per_page' => (int) ($validated['per_page'] ?? 10),
        ];

        return Inertia::render('feedback/index', $this->feedbackService->payload($filters));
    }

}
