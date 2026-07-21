<?php

namespace App\Policies\Concerns;

use App\Enums\StaffModule;
use App\Models\StaffAccount;
use App\Models\User;

trait AuthorizesStaffAccess
{
    protected function canAccessModule(StaffAccount|User $user, StaffModule $module): bool
    {
        return $user instanceof User
            || ($user->is_active && $user->canAccessModule($module));
    }

    protected function canAccessBranch(StaffAccount|User $user, ?int $branchId): bool
    {
        return $user instanceof User || $user->canAccessBranch($branchId);
    }
}
