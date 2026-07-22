<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Http\Requests\ResetAccountPasswordRequest;
use App\Http\Requests\SendAccountPasswordResetLinkRequest;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Services\AccountLocator;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;

class AccountPasswordResetController extends Controller
{
    public function __construct(private AccountLocator $accountLocator) {}

    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(SendAccountPasswordResetLinkRequest $request): RedirectResponse
    {
        $email = $request->string('email')->lower()->toString();
        $account = $this->accountLocator->findByEmail($email);

        if ($account !== null) {
            $accountType = $this->accountLocator->typeOf($account);
            Password::broker($accountType->passwordBroker())->sendResetLink(['email' => $email]);
        }

        return back()->with('status', $this->genericResetStatus());
    }

    public function edit(Request $request, string $accountType, string $token): Response
    {
        abort_unless(AccountType::tryFrom($accountType) !== null, 404);

        return Inertia::render('auth/reset-password', [
            'accountType' => $accountType,
            'email' => $request->string('email')->toString(),
            'token' => $token,
            'passwordRules' => PasswordRule::defaults()->toPasswordRulesString(),
        ]);
    }

    public function update(ResetAccountPasswordRequest $request): RedirectResponse
    {
        $accountType = AccountType::from($request->string('account_type')->toString());
        $credentials = $request->safe()->only([
            'email',
            'password',
            'password_confirmation',
            'token',
        ]);

        $status = Password::broker($accountType->passwordBroker())->reset(
            $credentials,
            function (StaffAccount|Patient $account, string $password): void {
                $account->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($account));
            },
        );

        if ($status !== Password::PasswordReset) {
            return back()->withErrors(['email' => trans($status)]);
        }

        return to_route('login')->with('status', trans($status));
    }

    private function genericResetStatus(): string
    {
        return 'If an account exists for that email address, a password reset link has been sent.';
    }
}
