<?php

namespace App\Http\Middleware;

use App\Enums\StaffModule;
use App\Models\StaffAccount;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffModuleAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $staffModule = StaffModule::tryFrom($module);
        $user = $request->user();

        abort_if($staffModule === null, 404);

        if ($user instanceof User) {
            return $next($request);
        }

        abort_unless(
            $user instanceof StaffAccount
                && $user->is_active
                && $user->canAccessModule($staffModule),
            403,
            'You do not have access to this module.',
        );

        return $next($request);
    }
}
