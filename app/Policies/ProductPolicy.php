<?php

namespace App\Policies;

use App\Enums\StaffModule;
use App\Models\Product;
use App\Models\StaffAccount;
use App\Models\User;
use App\Policies\Concerns\AuthorizesStaffAccess;

class ProductPolicy
{
    use AuthorizesStaffAccess;

    public function viewAny(StaffAccount|User $user): bool
    {
        return $this->canAccessModule($user, StaffModule::Inventory);
    }

    public function view(StaffAccount|User $user, Product $product): bool
    {
        return $this->viewAny($user) && $this->canAccessBranch($user, $product->branch_ID);
    }

    public function create(StaffAccount|User $user): bool
    {
        return $this->viewAny($user);
    }

    public function createForBranch(StaffAccount|User $user, int $branchId): bool
    {
        return $this->create($user) && $this->canAccessBranch($user, $branchId);
    }

    public function update(StaffAccount|User $user, Product $product): bool
    {
        return $this->view($user, $product);
    }

    public function delete(StaffAccount|User $user, Product $product): bool
    {
        return $this->view($user, $product);
    }

    public function restore(StaffAccount|User $user, Product $product): bool
    {
        return $this->view($user, $product);
    }

    public function forceDelete(StaffAccount|User $user, Product $product): bool
    {
        return $this->view($user, $product);
    }
}
