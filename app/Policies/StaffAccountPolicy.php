<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Enums\StaffRole;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class StaffAccountPolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Staff);
    }

    public function view(StaffAccount|User $user, StaffAccount $staffAccount): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $user instanceof User
            || $user->isSuperAdmin()
            || (! $staffAccount->isSuperAdmin() && $user->canAccessBranch($staffAccount->branch_ID));
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(StaffAccount|User $user, StaffAccount $staffAccount): bool
    {
        return $this->view($user, $staffAccount);
    }

    public function assign(StaffAccount|User $user, string $roleName, ?int $branchId): bool
    {
        if (! $this->create($user) || $user instanceof User || $user->isSuperAdmin()) {
            return $this->create($user);
        }

        return $roleName !== StaffRole::SuperAdmin->value
            && $user->canAccessBranch($branchId);
    }
}
