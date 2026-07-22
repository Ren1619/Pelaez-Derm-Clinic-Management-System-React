<?php

namespace App\Services;

use App\Enums\AccountType;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Notifications\PatientAccountInvitation;
use App\Notifications\StaffAccountInvitation;
use Illuminate\Support\Facades\Password;

/**
 * Sends verification and password-setup emails for unverified accounts.
 */
class AccountVerificationService
{
    /**
     * Create the service with the shared indexed account locator.
     */
    public function __construct(private AccountLocator $accountLocator) {}

    /**
     * Send a fresh signed verification link and password-setup token.
     */
    public function sendSetupEmail(StaffAccount|Patient $account): void
    {
        if ($account->hasVerifiedEmail()) {
            return;
        }

        $accountType = $this->accountLocator->typeOf($account);
        $passwordResetToken = Password::broker($accountType->passwordBroker())->createToken($account);

        // Each account type keeps its own wording and signed verification route.
        $notification = $accountType === AccountType::Staff
            ? new StaffAccountInvitation($passwordResetToken)
            : new PatientAccountInvitation($passwordResetToken);

        $account->notify($notification);
    }
}
