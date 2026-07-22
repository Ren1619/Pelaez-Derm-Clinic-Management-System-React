<?php

namespace App\Http\Controllers;

use App\Http\Requests\AppointmentAvailabilityRequest;
use App\Services\Appointments\AppointmentScheduleService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class AppointmentAvailabilityController extends Controller
{
    public function __construct(private AppointmentScheduleService $scheduleService) {}

    public function __invoke(AppointmentAvailabilityRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return response()->json([
            'date' => $validated['date'],
            'capacity_per_slot' => AppointmentScheduleService::CAPACITY_PER_SLOT,
            'slots' => $this->scheduleService->availability(
                (int) $validated['branch_ID'],
                CarbonImmutable::createFromFormat('Y-m-d', $validated['date']),
                isset($validated['exclude_appointment_ID'])
                    ? (int) $validated['exclude_appointment_ID']
                    : null,
            ),
        ]);
    }
}
