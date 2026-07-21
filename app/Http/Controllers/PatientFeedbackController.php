<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientFeedbackRequest;
use App\Models\Patient;
use App\Services\PatientFeedbackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientFeedbackController extends Controller
{
    public function __construct(private PatientFeedbackService $feedbackService) {}

    public function index(Request $request): Response
    {
        /** @var Patient $patient */
        $patient = $request->user('patient');

        return Inertia::render('patient/feedback/index', $this->feedbackService->payload($patient));
    }

    public function store(StorePatientFeedbackRequest $request): RedirectResponse
    {
        /** @var Patient $patient */
        $patient = $request->user('patient');
        $this->feedbackService->create($patient, $request->validated());

        return back()->with('success', 'Feedback submitted successfully.');
    }
}
