<?php

namespace App\Enums;

enum NewRecordModule: string
{
    case Appointments = 'appointments';
    case Patients = 'patients';
    case Inventory = 'inventory';
    case PointOfSale = 'point_of_sale';
    case Services = 'services';
    case Categories = 'categories';
    case Staff = 'staff';
    case Branches = 'branches';
    case Distribution = 'distribution';
    case Feedback = 'feedback';

    public function staffModule(): StaffModule
    {
        return StaffModule::from($this->value);
    }
}
