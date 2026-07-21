<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardFilterRequest;
use App\Models\StaffAccount;
use App\Models\User;
use App\Services\Appointments\AppointmentStatusService;
use App\Services\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService,
        private AppointmentStatusService $appointmentStatusService,
    ) {}

    public function __invoke(DashboardFilterRequest $request): Response
    {
        $this->appointmentStatusService->sync();
        $user = $request->user();

        abort_unless($user instanceof StaffAccount || $user instanceof User, 403);

        return Inertia::render('dashboard', $this->dashboardService->payload(
            $user,
            $request->validated(),
        ));
    }
}
