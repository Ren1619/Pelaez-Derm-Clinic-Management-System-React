<?php

namespace App\Enums;

/**
 * Identifies the supported authentication account types.
 */
enum AccountType: string
{
    case Staff = 'staff';
    case Patient = 'patient';

    /**
     * Return the session guard used by this account type.
     */
    public function guard(): string
    {
        return match ($this) {
            self::Staff => 'web',
            self::Patient => 'patient',
        };
    }

    /**
     * Return the password broker used by this account type.
     */
    public function passwordBroker(): string
    {
        return match ($this) {
            self::Staff => 'staff_accounts',
            self::Patient => 'patients',
        };
    }
}
