<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PatientEmailVerificationController extends Controller
{
    public function __invoke(Request $request, Patient $patient, string $hash): RedirectResponse
    {
        abort_unless(
            hash_equals(sha1($patient->getEmailForVerification()), $hash),
            403,
        );

        if (! $patient->hasVerifiedEmail() && $patient->markEmailAsVerified()) {
            event(new Verified($patient));
        }

        return redirect()->route('home')->with(
            'status',
            'Your patient email address has been verified.',
        );
    }
}
