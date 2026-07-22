<?php

namespace App\Services;

use App\Enums\AccountType;
use App\Models\Patient;
use App\Models\StaffAccount;

class AccountLocator
{
    public function findByEmail(string $email): StaffAccount|Patient|null
    {
        $staffAccount = StaffAccount::query()
            ->select([
                'account_ID',
                'branch_ID',
                'role_ID',
                'email',
                'email_verified_at',
                'is_active',
                'password',
            ])
            ->where('email', $email)
            ->first();

        if ($staffAccount !== null) {
            return $staffAccount;
        }

        return Patient::query()
            ->select(['PID', 'email', 'email_verified_at', 'password'])
            ->where('email', $email)
            ->first();
    }

    public function typeOf(StaffAccount|Patient $account): AccountType
    {
        return $account instanceof StaffAccount
            ? AccountType::Staff
            : AccountType::Patient;
    }
}
