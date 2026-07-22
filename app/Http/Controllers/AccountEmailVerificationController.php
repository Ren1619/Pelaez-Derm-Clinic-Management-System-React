<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResendAccountVerificationRequest;
use App\Models\StaffAccount;
use App\Services\AccountLocator;
use App\Services\AccountVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles shared verification-email requests for staff and patients.
 */
class AccountEmailVerificationController extends Controller
{
    /**
     * Create the controller with account lookup and email services.
     */
    public function __construct(
        private AccountLocator $accountLocator,
        private AccountVerificationService $accountVerificationService,
    ) {}

    /**
     * Show the shared resend-verification form.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/resend-verification', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Send a fresh setup email without revealing whether an account exists.
     */
    public function store(ResendAccountVerificationRequest $request): RedirectResponse
    {
        $email = $request->string('email')->lower()->toString();
        $account = $this->accountLocator->findByEmail($email);

        // Inactive staff accounts must not receive new access links.
        if ($account !== null && ! ($account instanceof StaffAccount && ! $account->is_active)) {
            $this->accountVerificationService->sendSetupEmail($account);
        }

        return back()->with(
            'status',
            'If an unverified account exists for that email address, a new verification link has been sent.',
        );
    }
}
