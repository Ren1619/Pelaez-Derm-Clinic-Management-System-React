<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Expense;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class ExpensePolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool { return $this->canAccessModule($user, StaffModule::PointOfSale); }
    public function view(StaffAccount|User $user, Expense $expense): bool { return $this->viewAny($user) && $this->canAccessBranch($user, $expense->branch_ID); }
    public function create(StaffAccount|User $user): bool { return $this->viewAny($user); }
    public function createForBranch(StaffAccount|User $user, int $branchId): bool { return $this->create($user) && $this->canAccessBranch($user, $branchId); }
    public function update(StaffAccount|User $user, Expense $expense): bool { return $this->view($user, $expense); }
    public function delete(StaffAccount|User $user, Expense $expense): bool { return $this->view($user, $expense); }
    public function restore(StaffAccount|User $user, Expense $expense): bool { return $this->view($user, $expense); }
    public function forceDelete(StaffAccount|User $user, Expense $expense): bool { return $this->view($user, $expense); }
}
