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

class AccountAuthenticationController extends Controller
{
    public function __construct(private AccountLocator $accountLocator) {}

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
                'email' => 'Please verify your email address before logging in.',
            ]);
        }

        $accountType = $this->accountLocator->typeOf($account);
        Auth::guard($accountType->guard())->login($account, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->to($this->landingUrl($account, $accountType));
    }

    private function landingUrl(StaffAccount|Patient $account, AccountType $accountType): string
    {
        if ($accountType === AccountType::Patient) {
            return route('patient.feedback.index');
        }

        /** @var StaffAccount $account */
        return route($account->roleKey()?->landingRoute() ?? 'login');
    }
}
