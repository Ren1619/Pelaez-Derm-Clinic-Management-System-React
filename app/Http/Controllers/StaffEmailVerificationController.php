<?php

namespace App\Http\Controllers;

use App\Models\StaffAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StaffEmailVerificationController extends Controller
{
    public function __invoke(Request $request, StaffAccount $staffAccount, string $hash): RedirectResponse
    {
        abort_unless(
            hash_equals(sha1($staffAccount->getEmailForVerification()), $hash),
            403,
        );

        if (! $staffAccount->hasVerifiedEmail()) {
            $staffAccount->markEmailAsVerified();
        }

        return redirect()->route('login')->with(
            'status',
            'Your staff email address has been verified.',
        );
    }
}
