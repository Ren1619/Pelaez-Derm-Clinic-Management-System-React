<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
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

        $passwordResetToken = $request->string('password_reset_token')->toString();

        if ($passwordResetToken !== '') {
            return redirect()->route('password.reset', [
                'accountType' => AccountType::Patient->value,
                'token' => $passwordResetToken,
                'email' => $patient->email,
            ]);
        }

        return redirect()->route('login')->with(
            'status',
            'Your patient email address has been verified.',
        );
    }
}
