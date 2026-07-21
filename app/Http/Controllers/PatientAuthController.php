<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientLoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PatientAuthController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (Auth::guard('patient')->check()) {
            return to_route('patient.feedback.index');
        }

        return Inertia::render('patient/auth/login');
    }

    public function store(PatientLoginRequest $request): RedirectResponse
    {
        $credentials = $request->safe()->only(['email', 'password']);

        if (! Auth::guard('patient')->attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        $patient = Auth::guard('patient')->user();

        if ($patient === null || ! $patient->hasVerifiedEmail()) {
            Auth::guard('patient')->logout();

            throw ValidationException::withMessages([
                'email' => 'Please verify your email address before logging in.',
            ]);
        }

        $request->session()->regenerate();
        $intended = $request->session()->pull('url.intended');

        return redirect()->to($this->patientIntendedUrl($request, $intended));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('patient')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('patient.login');
    }

    private function patientIntendedUrl(Request $request, mixed $intended): string
    {
        if (! is_string($intended)) {
            return route('patient.feedback.index');
        }

        $host = parse_url($intended, PHP_URL_HOST);
        $path = '/'.ltrim((string) parse_url($intended, PHP_URL_PATH), '/');

        if (($host !== null && $host !== $request->getHost()) || ! str_starts_with($path, '/patient/')) {
            return route('patient.feedback.index');
        }

        if ($path === '/patient/login') {
            return route('patient.feedback.index');
        }

        return $intended;
    }
}
