<?php

namespace App\Enums;

enum StaffModule: string
{
    case Dashboard = 'dashboard';
    case Branches = 'branches';
    case Staff = 'staff';
    case Patients = 'patients';
    case Appointments = 'appointments';
    case Feedback = 'feedback';
    case Categories = 'categories';
    case Services = 'services';
    case Inventory = 'inventory';
    case Distribution = 'distribution';
    case Reports = 'reports';
    case PointOfSale = 'point_of_sale';
    case Logs = 'logs';
    case SystemSettings = 'system_settings';
}
