<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePatientIsAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('patient')->check()) {
            $request->session()->put('url.intended', $request->fullUrl());

            return redirect()->route('patient.login');
        }

        $patient = Auth::guard('patient')->user();

        if ($patient === null || ! $patient->hasVerifiedEmail()) {
            Auth::guard('patient')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('patient.login')
                ->withErrors(['email' => 'Please verify your email address before logging in.']);
        }

        return $next($request);
    }
}
