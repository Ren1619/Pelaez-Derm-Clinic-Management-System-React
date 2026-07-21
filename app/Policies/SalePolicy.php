<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Sale;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class SalePolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool { return $this->canAccessModule($user, StaffModule::PointOfSale); }
    public function view(StaffAccount|User $user, Sale $sale): bool { return $this->viewAny($user) && $this->canAccessBranch($user, $sale->branch_ID); }
    public function create(StaffAccount|User $user): bool { return $this->viewAny($user); }
    public function createForBranch(StaffAccount|User $user, int $branchId): bool { return $this->create($user) && $this->canAccessBranch($user, $branchId); }
    public function update(StaffAccount|User $user, Sale $sale): bool { return $this->view($user, $sale); }
    public function delete(StaffAccount|User $user, Sale $sale): bool { return $this->view($user, $sale); }
    public function restore(StaffAccount|User $user, Sale $sale): bool { return $this->view($user, $sale); }
    public function forceDelete(StaffAccount|User $user, Sale $sale): bool { return $this->view($user, $sale); }
}
