<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class PatientPolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Patients);
    }

    public function view(StaffAccount|User $user, Patient $patient): bool
    {
        return $this->viewAny($user);
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(StaffAccount|User $user, Patient $patient): bool
    {
        return $this->viewAny($user);
    }

    public function delete(StaffAccount|User $user, Patient $patient): bool
    {
        return $this->viewAny($user);
    }

    public function restore(StaffAccount|User $user, Patient $patient): bool
    {
        return $this->viewAny($user);
    }

    public function forceDelete(StaffAccount|User $user, Patient $patient): bool
    {
        return $this->viewAny($user);
    }
}
