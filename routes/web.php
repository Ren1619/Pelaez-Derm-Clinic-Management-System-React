<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\AccountAuthenticationController;
use App\Http\Controllers\AccountPasswordResetController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AppointmentStatusController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\DistributionController;
use App\Http\Controllers\DistributionStatusController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportExportController;
use App\Http\Controllers\ReportPrintController;
use App\Http\Controllers\PatientAllergyController;
use App\Http\Controllers\PatientMedicalConditionController;
use App\Http\Controllers\PatientMedicationController;
use App\Http\Controllers\PatientVisitController;
use App\Http\Controllers\PatientVisitDiagnosisController;
use App\Http\Controllers\PatientVisitPrescriptionController;
use App\Http\Controllers\PatientVisitProductController;
use App\Http\Controllers\PatientVisitServiceController;
use App\Http\Controllers\PointOfSaleController;
use App\Http\Controllers\PosCheckoutController;
use App\Http\Controllers\PosExpenseCategoryController;
use App\Http\Controllers\PosExpenseController;
use App\Http\Controllers\PosReceiptController;
use App\Http\Controllers\PosSaleReturnController;
use App\Http\Controllers\PatientEmailVerificationController;
use App\Http\Controllers\PatientAuthController;
use App\Http\Controllers\PatientFeedbackController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StaffAccountController;
use App\Http\Controllers\StaffEmailVerificationController;
use App\Http\Controllers\StartAppointmentVisitController;
use App\Http\Controllers\PublicWebsiteController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Middleware\RecordReadActivity;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicWebsiteController::class, 'home'])->name('home');
Route::get('services/all', [PublicWebsiteController::class, 'services'])->name('public.services');
Route::get('branch/all', [PublicWebsiteController::class, 'branches'])->name('public.branches');
Route::get('privacy-notice', [PublicWebsiteController::class, 'privacyNotice'])->name('public.privacy-notice');

Route::get('staff/verify-email/{staffAccount}/{hash}', StaffEmailVerificationController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('staff.verification.verify');

Route::get('patients/verify-email/{patient}/{hash}', PatientEmailVerificationController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('patients.verification.verify');

Route::middleware(['guest:web', 'guest:patient'])->group(function () {
    Route::post('account/login', [AccountAuthenticationController::class, 'store'])
        ->middleware('throttle:login')
        ->name('account.login.store');

    Route::get('forgot-password', [AccountPasswordResetController::class, 'create'])
        ->name('password.request');
    Route::post('forgot-password', [AccountPasswordResetController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');
    Route::get('reset-password/{accountType}/{token}', [AccountPasswordResetController::class, 'edit'])
        ->name('password.reset');
    Route::post('reset-password', [AccountPasswordResetController::class, 'update'])
        ->name('password.update');
});

Route::prefix('patient')->name('patient.')->group(function () {
    Route::redirect('login', '/login')->name('login');
    Route::post('login', [AccountAuthenticationController::class, 'store'])
        ->middleware('throttle:patient-login')
        ->name('login.store');

    Route::middleware(['patient.auth', RecordReadActivity::class])->group(function () {
        Route::get('feedback', [PatientFeedbackController::class, 'index'])->name('feedback.index');
        Route::post('feedback', [PatientFeedbackController::class, 'store'])->name('feedback.store');
        Route::post('logout', [PatientAuthController::class, 'destroy'])->name('logout');
    });
});

Route::middleware(['auth', 'verified', RecordReadActivity::class])->group(function () {
    Route::get('dashboard', DashboardController::class)
        ->middleware('staff.module:dashboard')
        ->name('dashboard');

    Route::middleware('staff.module:appointments')->group(function () {
        Route::resource('appointments', AppointmentController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::patch('appointments/{appointment}/status', [AppointmentStatusController::class, 'update'])->name('appointments.status');
        Route::post('appointments/{appointment}/cancel', [AppointmentStatusController::class, 'cancel'])->name('appointments.cancel');
        Route::post('appointments/{appointment}/start-visit', StartAppointmentVisitController::class)->name('appointments.start-visit');
    });

    Route::resource('feedback', FeedbackController::class)
        ->only(['index'])
        ->middleware('staff.module:feedback');

    Route::resource('branches', BranchController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('staff.module:branches');

    Route::resource('categories', CategoryController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('staff.module:categories');

    Route::middleware('staff.module:inventory')->group(function () {
        Route::post('inventory/{product}/restock', [InventoryController::class, 'restock'])
            ->name('inventory.restock');
        Route::resource('inventory', InventoryController::class)
            ->parameters(['inventory' => 'product'])
            ->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('staff.module:distribution')->group(function () {
        Route::patch('distributions/{distribution}/send', [DistributionStatusController::class, 'send'])
            ->name('distributions.send');
        Route::patch('distributions/{distribution}/receive', [DistributionStatusController::class, 'receive'])
            ->name('distributions.receive');
        Route::patch('distributions/{distribution}/cancel', [DistributionStatusController::class, 'cancel'])
            ->name('distributions.cancel');
        Route::resource('distributions', DistributionController::class)->only(['index', 'store', 'destroy']);
    });

    Route::middleware('staff.module:reports')->group(function () {
        Route::get('reports/print/branch-sales', [ReportPrintController::class, 'branchSales'])
            ->name('reports.print.branch-sales');
        Route::get('reports/print/sales/{reportPeriod}', [ReportPrintController::class, 'sales'])
            ->whereIn('reportPeriod', ['daily', 'weekly', 'monthly', 'quarterly', 'annual'])
            ->name('reports.print.sales');
        Route::get('reports/export', ReportExportController::class)->name('reports.export');
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    });

    Route::middleware('staff.module:logs')->group(function () {
        Route::get('logs/export', [ActivityLogController::class, 'export'])->name('logs.export');
        Route::get('logs', [ActivityLogController::class, 'index'])->name('logs.index');
    });

    Route::middleware('staff.module:system_settings')->group(function () {
        Route::get('system-settings', [SystemSettingsController::class, 'index'])
            ->name('system-settings.index');
        Route::post('system-settings/{section}', [SystemSettingsController::class, 'update'])
            ->whereIn('section', ['landing', 'services', 'branches', 'privacy', 'business'])
            ->name('system-settings.update');
    });

    Route::resource('services', ServiceController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware('staff.module:services');

    Route::middleware('staff.module:point_of_sale')->group(function () {
        Route::get('point-of-sale', [PointOfSaleController::class, 'index'])->name('pos.index');
        Route::post('point-of-sale/checkout', PosCheckoutController::class)->name('pos.checkout');
        Route::get('point-of-sale/sales/{sale}/receipt', PosReceiptController::class)->name('pos.sales.receipt');
        Route::post('point-of-sale/sales/{sale}/void', [PosSaleReturnController::class, 'void'])->name('pos.sales.void');
        Route::post('point-of-sale/sales/{sale}/returns', [PosSaleReturnController::class, 'store'])->name('pos.sales.returns.store');
        Route::post('point-of-sale/expenses', [PosExpenseController::class, 'store'])->name('pos.expenses.store');
        Route::delete('point-of-sale/expenses/{expense}', [PosExpenseController::class, 'destroy'])->name('pos.expenses.destroy');
        Route::post('point-of-sale/expense-categories', PosExpenseCategoryController::class)->name('pos.expense-categories.store');
    });

    Route::middleware('staff.module:patients')->group(function () {
    Route::resource('patients', PatientController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::post('patients/{patient}/medical-conditions', [PatientMedicalConditionController::class, 'store'])->name('patients.medical-conditions.store');
    Route::patch('patients/{patient}/medical-conditions/{medicalCondition}', [PatientMedicalConditionController::class, 'update'])->scopeBindings()->name('patients.medical-conditions.update');
    Route::delete('patients/{patient}/medical-conditions/{medicalCondition}', [PatientMedicalConditionController::class, 'destroy'])->scopeBindings()->name('patients.medical-conditions.destroy');
    Route::post('patients/{patient}/allergies', [PatientAllergyController::class, 'store'])->name('patients.allergies.store');
    Route::patch('patients/{patient}/allergies/{allergy}', [PatientAllergyController::class, 'update'])->scopeBindings()->name('patients.allergies.update');
    Route::delete('patients/{patient}/allergies/{allergy}', [PatientAllergyController::class, 'destroy'])->scopeBindings()->name('patients.allergies.destroy');
    Route::post('patients/{patient}/medications', [PatientMedicationController::class, 'store'])->name('patients.medications.store');
    Route::patch('patients/{patient}/medications/{medication}', [PatientMedicationController::class, 'update'])->scopeBindings()->name('patients.medications.update');
    Route::delete('patients/{patient}/medications/{medication}', [PatientMedicationController::class, 'destroy'])->scopeBindings()->name('patients.medications.destroy');
    Route::post('patients/{patient}/visits', [PatientVisitController::class, 'store'])->name('patients.visits.store');
    Route::patch('patients/{patient}/visits/{visit}', [PatientVisitController::class, 'update'])->scopeBindings()->name('patients.visits.update');
    Route::delete('patients/{patient}/visits/{visit}', [PatientVisitController::class, 'destroy'])->scopeBindings()->name('patients.visits.destroy');
    Route::post('patients/{patient}/visits/{visit}/diagnoses', [PatientVisitDiagnosisController::class, 'store'])->scopeBindings()->name('patients.visits.diagnoses.store');
    Route::patch('patients/{patient}/visits/{visit}/diagnoses/{diagnosis}', [PatientVisitDiagnosisController::class, 'update'])->scopeBindings()->name('patients.visits.diagnoses.update');
    Route::delete('patients/{patient}/visits/{visit}/diagnoses/{diagnosis}', [PatientVisitDiagnosisController::class, 'destroy'])->scopeBindings()->name('patients.visits.diagnoses.destroy');
    Route::post('patients/{patient}/visits/{visit}/prescriptions', [PatientVisitPrescriptionController::class, 'store'])->scopeBindings()->name('patients.visits.prescriptions.store');
    Route::patch('patients/{patient}/visits/{visit}/prescriptions/{prescription}', [PatientVisitPrescriptionController::class, 'update'])->scopeBindings()->name('patients.visits.prescriptions.update');
    Route::delete('patients/{patient}/visits/{visit}/prescriptions/{prescription}', [PatientVisitPrescriptionController::class, 'destroy'])->scopeBindings()->name('patients.visits.prescriptions.destroy');
    Route::post('patients/{patient}/visits/{visit}/services', [PatientVisitServiceController::class, 'store'])->scopeBindings()->name('patients.visits.services.store');
    Route::patch('patients/{patient}/visits/{visit}/services/{service}', [PatientVisitServiceController::class, 'update'])->scopeBindings()->name('patients.visits.services.update');
    Route::delete('patients/{patient}/visits/{visit}/services/{service}', [PatientVisitServiceController::class, 'destroy'])->scopeBindings()->name('patients.visits.services.destroy');
    Route::post('patients/{patient}/visits/{visit}/products', [PatientVisitProductController::class, 'store'])->scopeBindings()->name('patients.visits.products.store');
    Route::patch('patients/{patient}/visits/{visit}/products/{product}', [PatientVisitProductController::class, 'update'])->scopeBindings()->name('patients.visits.products.update');
    Route::delete('patients/{patient}/visits/{visit}/products/{product}', [PatientVisitProductController::class, 'destroy'])->scopeBindings()->name('patients.visits.products.destroy');
    });

    Route::resource('staff', StaffAccountController::class)
        ->parameters(['staff' => 'staffAccount'])
        ->only(['index', 'store', 'update'])
        ->middleware('staff.module:staff');
    Route::patch('staff/{staffAccount}/status', [StaffAccountController::class, 'toggleStatus'])
        ->middleware('staff.module:staff')
        ->name('staff.status');
});

require __DIR__.'/settings.php';
