<?php

use App\Models\AccountRole;
use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Distribution;
use App\Models\Feedback;
use App\Models\MajorServiceCategory;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Sale;
use App\Models\SaleServiceItem;
use App\Models\StaffAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

test('the database seeder creates login-ready accounts and year-round report data', function () {
    $this->seed();

    expect(AccountRole::query()->pluck('role_name')->all())
        ->toContain('super_admin', 'admin', 'staff', 'doctor');

    foreach (['super_admin', 'admin', 'staff', 'doctor'] as $role) {
        expect(StaffAccount::query()->whereHas('role', fn ($query) => $query->where('role_name', $role))->exists())->toBeTrue();
    }

    $superAdmin = StaffAccount::query()->where('email', 'superadmin@gmail.com')->firstOrFail();
    $patient = Patient::query()->where('email', 'patient.demo@pelaez.test')->firstOrFail();
    expect(Hash::check('Password123!', $superAdmin->password))->toBeTrue()
        ->and(Hash::check('Patient123!', $patient->password))->toBeTrue()
        ->and(StaffAccount::query()->count())->toBe(7)
        ->and(Patient::query()->count())->toBeGreaterThanOrEqual(12)
        ->and(PatientVisit::query()->count())->toBeGreaterThanOrEqual(24)
        ->and(Appointment::query()->where('status', 'completed')->count())->toBeGreaterThanOrEqual(24)
        ->and(Feedback::query()->count())->toBeGreaterThanOrEqual(24)
        ->and(Sale::query()->count())->toBeGreaterThanOrEqual(72)
        ->and(SaleServiceItem::query()->sum('quantity'))->toBeGreaterThan(72)
        ->and(Distribution::query()->distinct()->pluck('status')->all())
        ->toContain('pending', 'in_transit', 'delivered', 'cancelled')
        ->and(ActivityLog::query()->count())->toBe(count(ActivityLog::contextLabels()) * 3);

    $utilizationCombinations = DB::table('sale_service_items')
        ->join('sales', 'sale_service_items.sale_ID', '=', 'sales.sale_ID')
        ->join('services', 'sale_service_items.service_ID', '=', 'services.service_ID')
        ->join('categories', 'services.category_ID', '=', 'categories.category_ID')
        ->select('sales.branch_ID', 'categories.major_service_category_ID')
        ->distinct()
        ->get();

    expect($utilizationCombinations)->toHaveCount(
        Branch::query()->count() * MajorServiceCategory::query()->count(),
    );
});
