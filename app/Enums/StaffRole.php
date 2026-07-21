<?php

namespace App\Enums;

enum StaffRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Staff = 'staff';
    case Doctor = 'doctor';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::Staff => 'Staff',
            self::Doctor => 'Doctor',
        };
    }

    /** @return list<StaffModule> */
    public function modules(): array
    {
        return match ($this) {
            self::SuperAdmin => StaffModule::cases(),
            self::Admin => [
                StaffModule::Dashboard,
                StaffModule::Staff,
                StaffModule::Patients,
                StaffModule::Appointments,
                StaffModule::Feedback,
                StaffModule::Categories,
                StaffModule::Services,
                StaffModule::Inventory,
                StaffModule::Distribution,
                StaffModule::Reports,
                StaffModule::PointOfSale,
                StaffModule::Logs,
            ],
            self::Staff => [
                StaffModule::Dashboard,
                StaffModule::Patients,
                StaffModule::Appointments,
                StaffModule::Feedback,
                StaffModule::Distribution,
                StaffModule::PointOfSale,
            ],
            self::Doctor => [StaffModule::Patients],
        };
    }

    public function landingRoute(): string
    {
        return $this === self::Doctor ? 'patients.index' : 'dashboard';
    }
}
