<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\SystemNotification;
use App\Services\SystemNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PatientNotificationController extends Controller
{
    public function __construct(private SystemNotificationService $notifications) {}

    public function read(Request $request, SystemNotification $systemNotification): RedirectResponse
    {
        $this->notifications->markPatientRead($this->patient($request), $systemNotification);

        return back();
    }

    public function readAll(Request $request): RedirectResponse
    {
        $this->notifications->markAllPatientRead($this->patient($request));

        return back();
    }

    private function patient(Request $request): Patient
    {
        $patient = $request->user('patient');
        abort_unless($patient instanceof Patient, 401);

        return $patient;
    }
}
