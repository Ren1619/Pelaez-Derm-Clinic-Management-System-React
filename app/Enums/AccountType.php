<?php

namespace App\Enums;

enum AccountType: string
{
    case Staff = 'staff';
    case Patient = 'patient';

    public function guard(): string
    {
        return match ($this) {
            self::Staff => 'web',
            self::Patient => 'patient',
        };
    }

    public function passwordBroker(): string
    {
        return match ($this) {
            self::Staff => 'staff_accounts',
            self::Patient => 'patients',
        };
    }
}
