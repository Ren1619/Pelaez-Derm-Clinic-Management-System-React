<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Http\Requests\AccountLoginRequest;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Services\AccountLocator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Authenticates staff and patient accounts from one login form.
 */
class AccountAuthenticationController extends Controller
{
    /**
     * Create the controller with the shared account locator.
     */
    public function __construct(private AccountLocator $accountLocator) {}

    /**
     * Validate credentials and start the correct account session.
     */
    public function store(AccountLoginRequest $request): RedirectResponse
    {
        $email = $request->string('email')->lower()->toString();
        $account = $this->accountLocator->findByEmail($email);

        if ($account === null
            || ($account instanceof StaffAccount && ! $account->is_active)
            || ! Hash::check($request->string('password')->toString(), $account->password)) {
            throw ValidationException::withMessages(['email' => trans('auth.failed')]);
        }

        if (! $account->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => 'Please verify your email address before logging in. You can resend the verification email below.',
            ]);
        }

        $accountType = $this->accountLocator->typeOf($account);
        Auth::guard($accountType->guard())->login($account, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->to($this->landingUrl($account, $accountType));
    }

    /**
     * Return the first page available to the authenticated account.
     */
    private function landingUrl(StaffAccount|Patient $account, AccountType $accountType): string
    {
        if ($accountType === AccountType::Patient) {
            return route('patient.feedback.index');
        }

        /** @var StaffAccount $account */
        return route($account->roleKey()?->landingRoute() ?? 'login');
    }
}
