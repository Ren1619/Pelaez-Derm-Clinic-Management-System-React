<?php

namespace App\Http\Responses;

use App\Models\StaffAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $routeName = $user instanceof StaffAccount
            ? $user->roleKey()?->landingRoute() ?? 'login'
            : 'dashboard';

        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->intended(route($routeName, absolute: false));
    }
}
