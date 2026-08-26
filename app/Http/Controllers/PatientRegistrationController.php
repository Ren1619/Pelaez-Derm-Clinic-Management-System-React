<?php

namespace App\Http\Controllers;

use App\Actions\RegisterPatient;
use App\Http\Requests\StorePatientRegistrationRequest;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PatientRegistrationController extends Controller
{
    public function create(): Response
    {
        $settings = SystemSetting::current()->toPublicArray();

        return Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'privacyNotice' => [
                'title' => $settings['privacy_title'],
                'sections' => $settings['privacy_sections'],
            ],
        ]);
    }

    public function store(
        StorePatientRegistrationRequest $request,
        RegisterPatient $registerPatient,
    ): RedirectResponse {
        $registerPatient->execute($request->validated());

        return to_route('login')->with(
            'status',
            'Your patient account has been created. Check your email to verify your account before logging in.',
        );
    }
}
