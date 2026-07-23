<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\MajorServiceCategory;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class MajorServiceCategoryPolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Categories);
    }

    public function view(StaffAccount|User $user, MajorServiceCategory $majorServiceCategory): bool
    {
        return $this->viewAny($user);
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(StaffAccount|User $user, MajorServiceCategory $majorServiceCategory): bool
    {
        return $this->canManage($user);
    }

    public function delete(StaffAccount|User $user, MajorServiceCategory $majorServiceCategory): bool
    {
        return $this->canManage($user);
    }

    private function canManage(StaffAccount|User $user): bool
    {
        return $user instanceof User || ($user->is_active && $user->isSuperAdmin());
    }
}
