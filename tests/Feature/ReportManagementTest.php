<?php

use App\Models\Branch;
use App\Models\Patient;
use App\Models\Sale;
use App\Models\SaleProductItem;
use App\Models\SaleReturn;
use App\Models\SaleServiceItem;
use App\Models\StaffAccount;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from reports', function () {
    $this->get(route('reports.index'))->assertRedirect(route('login'));
});

test('only super administrators and administrators can open reports', function () {
    $branch = Branch::factory()->create();
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);

    $this->actingAs($superAdmin)->get(route('reports.index'))->assertSuccessful();
    $this->actingAs($admin)->get(route('reports.index'))->assertSuccessful();

    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    $this->actingAs($staff)->get(route('reports.index'))->assertForbidden();
});

test('an administrator report is scoped to the assigned branch', function () {
    $assignedBranch = Branch::factory()->create(['branch_name' => 'Assigned Clinic']);
    $otherBranch = Branch::factory()->create(['branch_name' => 'Other Clinic']);
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $assignedBranch->branch_ID]);
    $patient = Patient::factory()->create();
    $ownSale = Sale::factory()->create([
        'branch_ID' => $assignedBranch->branch_ID,
        'branch_name' => $assignedBranch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => $patient->PID,
        'date' => today(),
        'subtotal_cost' => 1000,
        'discount_perc' => 10,
        'discount_amount' => 100,
        'total_cost' => 900,
    ]);
    Sale::factory()->create([
        'branch_ID' => $otherBranch->branch_ID,
        'branch_name' => $otherBranch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => $patient->PID,
        'date' => today(),
        'total_cost' => 5000,
    ]);
    SaleProductItem::factory()->create([
        'sale_ID' => $ownSale->sale_ID,
        'product_ID' => null,
        'product_name' => 'Facial Cleanser',
        'quantity' => 2,
        'unit_price' => 200,
        'line_total' => 400,
    ]);
    SaleServiceItem::factory()->create([
        'sale_ID' => $ownSale->sale_ID,
        'service_ID' => null,
        'service_name' => 'Consultation',
        'quantity' => 1,
        'custom_price' => 500,
        'line_total' => 500,
    ]);

    $this->actingAs($admin)
        ->get(route('reports.index', ['branch_ID' => $otherBranch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->where('filters.branch_ID', $assignedBranch->branch_ID)
            ->where('analytics.summary.totalSales', 900)
            ->where('analytics.summary.totalTransactions', 1)
            ->where('analytics.topProducts.0.name', 'Facial Cleanser')
            ->where('analytics.topProducts.0.revenue', 400)
            ->where('analytics.topServices.0.name', 'Consultation')
            ->has('branches', 1)
            ->has('branchSales.sales.data', 1));
});

test('reports exclude voided sales and show returns in branch net sales', function () {
    $branch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    $completed = Sale::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
        'subtotal_cost' => 1000,
        'discount_amount' => 0,
        'total_cost' => 1000,
    ]);
    SaleReturn::factory()->create([
        'sale_ID' => $completed->sale_ID,
        'processed_by' => $admin->account_ID,
        'return_amount' => 250,
    ]);
    Sale::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
        'subtotal_cost' => 400,
        'discount_amount' => 0,
        'total_cost' => 400,
        'is_voided' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('reports.index', ['summary_period' => 'today', 'sales_period' => 'today']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('analytics.summary.totalSales', 1000)
            ->where('analytics.summary.totalTransactions', 1)
            ->where('branchSales.stats.gross_sales', 1400)
            ->where('branchSales.stats.voided_amount', 400)
            ->where('branchSales.stats.returned_amount', 250)
            ->where('branchSales.stats.total_sales', 750));
});

test('branch sales can be filtered to the current quarter', function () {
    $branch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    Sale::factory()->create([
        'invoice_number' => 'INV-CURRENT-QUARTER',
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
    ]);
    Sale::factory()->create([
        'invoice_number' => 'INV-PREVIOUS-QUARTER',
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => now()->startOfQuarter()->subDay(),
    ]);

    $this->actingAs($admin)
        ->get(route('reports.index', ['sales_period' => 'quarter']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.sales_period', 'quarter')
            ->has('branchSales.sales.data', 1)
            ->where('branchSales.sales.data.0.invoice_number', 'INV-CURRENT-QUARTER'));
});

test('report exports are branch scoped csv downloads', function () {
    $branch = Branch::factory()->create(['branch_name' => 'Valencia Clinic']);
    $otherBranch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    Sale::factory()->create([
        'invoice_number' => 'INV-REPORT-001',
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
    ]);
    Sale::factory()->create([
        'invoice_number' => 'INV-OTHER-001',
        'branch_ID' => $otherBranch->branch_ID,
        'branch_name' => $otherBranch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
    ]);

    $response = $this->actingAs($admin)->get(route('reports.export', [
        'branch_ID' => $otherBranch->branch_ID,
        'sales_period' => 'all',
    ]));

    $response->assertSuccessful()
        ->assertDownload('valencia-clinic-branch-sales-all-'.today()->toDateString().'.csv');
    expect($response->streamedContent())
        ->toContain('INV-REPORT-001')
        ->not->toContain('INV-OTHER-001');
});

test('reports include quarterly and annual sales series', function () {
    $branch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    Sale::factory()->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
        'subtotal_cost' => 875,
        'discount_amount' => 0,
        'total_cost' => 875,
    ]);

    $this->actingAs($admin)
        ->get(route('reports.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('analytics.salesSeries.quarterly')
            ->has('analytics.salesSeries.annual')
            ->where('analytics.salesSeries.quarterly', fn ($series): bool => $series->sum('total') === 875)
            ->where('analytics.salesSeries.annual', fn ($series): bool => $series->sum('total') === 875));
});

test('an administrator can print each sales report only for the assigned branch', function (string $period) {
    $branch = Branch::factory()->create(['branch_name' => 'Valencia Clinic']);
    $otherBranch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    Sale::factory()->create([
        'invoice_number' => 'INV-PRINT-001',
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
    ]);
    Sale::factory()->create([
        'invoice_number' => 'INV-PRINT-OTHER',
        'branch_ID' => $otherBranch->branch_ID,
        'branch_name' => $otherBranch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
    ]);

    $this->actingAs($admin)
        ->get(route('reports.print.sales', [
            'reportPeriod' => $period,
            'branch_ID' => $otherBranch->branch_ID,
        ]))
        ->assertSuccessful()
        ->assertSee(Str::upper($period).' SALES REPORT')
        ->assertSee('Print / Save as PDF')
        ->assertSee('INV-PRINT-001')
        ->assertDontSee('INV-PRINT-OTHER');
})->with(['daily', 'weekly', 'monthly', 'quarterly', 'annual']);

test('the printable branch sales report keeps its active filters', function () {
    $branch = Branch::factory()->create(['branch_name' => 'Cagayan Clinic']);
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);
    Sale::factory()->create([
        'invoice_number' => 'INV-FILTERED-001',
        'customer_name' => 'Matching Patient',
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
    ]);
    Sale::factory()->create([
        'invoice_number' => 'INV-HIDDEN-001',
        'customer_name' => 'Different Patient',
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $admin->account_ID,
        'PID' => null,
        'date' => today(),
    ]);

    $this->actingAs($admin)
        ->get(route('reports.print.branch-sales', [
            'sales_period' => 'today',
            'search' => 'Matching Patient',
        ]))
        ->assertSuccessful()
        ->assertSee('BRANCH SALES REPORT')
        ->assertSee('INV-FILTERED-001')
        ->assertDontSee('INV-HIDDEN-001');
});

test('invalid printable sales report periods return not found', function () {
    $branch = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]);

    $this->actingAs($admin)
        ->get('/reports/print/sales/decade')
        ->assertNotFound();
});
