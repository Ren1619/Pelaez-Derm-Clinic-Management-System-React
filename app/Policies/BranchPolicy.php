<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class BranchPolicy
{
    use AuthorizesStaffAccess;
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Branches);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(StaffAccount|User $user, Branch $branch): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(StaffAccount|User $user, Branch $branch): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(StaffAccount|User $user, Branch $branch): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(StaffAccount|User $user, Branch $branch): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(StaffAccount|User $user, Branch $branch): bool
    {
        return $this->viewAny($user);
    }
}
