<?php

test('data entry forms use the required field convention', function (string $relativePath) {
    $source = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.$relativePath);

    expect($source)
        ->toContain('All fields with')
        ->toContain('are required.')
        ->toMatch('/<span\s+className="text-primary"\s+aria-hidden="true"\s*>/s');
})->with([
    'login' => 'resources/js/pages/auth/login.tsx',
    'forgot password' => 'resources/js/pages/auth/forgot-password.tsx',
    'reset password' => 'resources/js/pages/auth/reset-password.tsx',
    'confirm password' => 'resources/js/pages/auth/confirm-password.tsx',
    'resend verification' => 'resources/js/pages/auth/resend-verification.tsx',
    'profile settings' => 'resources/js/pages/settings/profile.tsx',
    'security settings' => 'resources/js/pages/settings/security.tsx',
    'branches' => 'resources/js/pages/branches/components/branch-dialog.tsx',
    'categories' => 'resources/js/pages/categories/components/category-dialog.tsx',
    'services' => 'resources/js/pages/services/components/service-dialog.tsx',
    'inventory' => 'resources/js/pages/inventory/components/product-dialog.tsx',
    'staff' => 'resources/js/pages/staff/components/staff-dialog.tsx',
    'patients' => 'resources/js/pages/patients/components/patient-dialog.tsx',
    'appointments' => 'resources/js/pages/appointments/components/appointment-dialog.tsx',
    'patient appointments' => 'resources/js/pages/patient/appointments/index.tsx',
    'patient visits' => 'resources/js/pages/patients/components/patient-visit-dialog.tsx',
    'visit records' => 'resources/js/pages/patients/components/patient-visit-record-dialog.tsx',
    'patient summaries' => 'resources/js/pages/patients/components/patient-summary-dialog.tsx',
    'patient health records' => 'resources/js/pages/patient/health-record/index.tsx',
    'patient feedback' => 'resources/js/pages/patient/feedback/index.tsx',
    'distributions' => 'resources/js/pages/distributions/index.tsx',
    'expenses' => 'resources/js/pages/pos/components/expense-dialogs.tsx',
    'sale returns' => 'resources/js/pages/pos/components/sale-details-dialog.tsx',
    'point of sale' => 'resources/js/pages/pos/index.tsx',
    'point of sale cart' => 'resources/js/pages/pos/components/pos-cart.tsx',
    'system settings' => 'resources/js/pages/system-settings/index.tsx',
]);
