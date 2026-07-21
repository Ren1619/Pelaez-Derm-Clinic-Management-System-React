<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Distribution;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class DistributionPolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Distribution);
    }

    public function view(StaffAccount|User $user, Distribution $distribution): bool
    {
        return $this->viewAny($user) && (
            $this->canAccessBranch($user, $distribution->from_branch_ID)
            || $this->canAccessBranch($user, $distribution->to_branch_ID)
        );
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user)
            && ($user instanceof User || $user->isSuperAdmin() || $user->isAdmin());
    }

    public function send(StaffAccount|User $user, Distribution $distribution): bool
    {
        return $this->viewAny($user)
            && $distribution->status === Distribution::Pending
            && $this->canAccessBranch($user, $distribution->from_branch_ID);
    }

    public function receive(StaffAccount|User $user, Distribution $distribution): bool
    {
        return $this->viewAny($user)
            && $distribution->status === Distribution::InTransit
            && $this->canAccessBranch($user, $distribution->to_branch_ID);
    }

    public function cancel(StaffAccount|User $user, Distribution $distribution): bool
    {
        return $this->view($user, $distribution)
            && in_array($distribution->status, [Distribution::Pending, Distribution::InTransit], true);
    }

    public function delete(StaffAccount|User $user, Distribution $distribution): bool
    {
        return $this->view($user, $distribution)
            && in_array($distribution->status, [Distribution::Delivered, Distribution::Cancelled], true);
    }
}
