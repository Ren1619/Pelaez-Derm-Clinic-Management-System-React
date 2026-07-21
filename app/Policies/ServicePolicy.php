<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class ServicePolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Services);
    }

    public function view(StaffAccount|User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(StaffAccount|User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }

    public function delete(StaffAccount|User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }

    public function restore(StaffAccount|User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }

    public function forceDelete(StaffAccount|User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }
}
