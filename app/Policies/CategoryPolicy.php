<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Category;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class CategoryPolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Categories);
    }

    public function view(StaffAccount|User $user, Category $category): bool
    {
        return $this->viewAny($user);
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(StaffAccount|User $user, Category $category): bool
    {
        return $this->viewAny($user);
    }

    public function delete(StaffAccount|User $user, Category $category): bool
    {
        return $this->viewAny($user);
    }
}
