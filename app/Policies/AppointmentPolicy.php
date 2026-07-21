<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Appointment;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class AppointmentPolicy
{
    use AuthorizesStaffAccess;
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Appointments);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(StaffAccount|User $user, Appointment $appointment): bool
    {
        return $this->viewAny($user) && $this->canAccessBranch($user, $appointment->branch_ID);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    public function createForBranch(StaffAccount|User $user, int $branchId): bool
    {
        return $this->create($user) && $this->canAccessBranch($user, $branchId);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(StaffAccount|User $user, Appointment $appointment): bool
    {
        return $this->view($user, $appointment);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(StaffAccount|User $user, Appointment $appointment): bool
    {
        return $this->view($user, $appointment);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(StaffAccount|User $user, Appointment $appointment): bool
    {
        return $this->view($user, $appointment);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(StaffAccount|User $user, Appointment $appointment): bool
    {
        return $this->view($user, $appointment);
    }
}
