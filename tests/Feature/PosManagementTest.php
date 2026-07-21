<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Patient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\StaffAccount;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

test('the POS uses one consolidated schema and guests are redirected', function () {
    foreach ([
        'sales',
        'sale_product_items',
        'sale_service_items',
        'sale_returns',
        'sale_return_items',
        'expense_categories',
        'expenses',
    ] as $table) {
        expect(Schema::hasTable($table))->toBeTrue();
    }

    $this->get(route('pos.index'))->assertRedirect(route('login'));
});

test('authenticated users can view the branch catalog daily sales and expenses', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $productCategory = Category::factory()->product()->create();
    $serviceCategory = Category::factory()->service()->create();
    Product::factory()->recycle([$branch, $productCategory])->create([
        'name' => 'Gentle Cleanser',
        'quantity' => 8,
        'expiration_date' => today()->addYear(),
    ]);
    Service::factory()->recycle($serviceCategory)->create(['name' => 'Consultation']);
    $patient = Patient::factory()->create(['first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
    $expenseCategory = ExpenseCategory::factory()->create(['category_name' => 'Utilities']);
    Expense::factory()->recycle([$branch, $user, $expenseCategory])->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'category_ID' => $expenseCategory->category_ID,
        'category_name' => $expenseCategory->category_name,
        'account_ID' => $user->account_ID,
        'expense_date' => today(),
    ]);

    $this->actingAs($user)
        ->get(route('pos.index', ['branch_ID' => $branch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/index')
            ->where('filters.branch_ID', $branch->branch_ID)
            ->where('products.0.name', 'Gentle Cleanser')
            ->where('products.0.quantity', 8)
            ->where('services.0.name', 'Consultation')
            ->where('patients.0.PID', $patient->PID)
            ->where('expenseCategories.0.category_name', 'Utilities')
            ->has('expenses', 1));
});

test('checkout calculates totals on the server and allocates product batches FIFO', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $serviceCategory = Category::factory()->service()->create();
    $patient = Patient::factory()->create();
    $earlyBatch = Product::factory()->recycle([$branch, $category])->create([
        'name' => 'Acne Wash',
        'price' => 100,
        'quantity' => 2,
        'expiration_date' => today()->addMonths(2),
    ]);
    $laterBatch = Product::factory()->recycle([$branch, $category])->create([
        'name' => 'Acne Wash',
        'price' => 120,
        'quantity' => 5,
        'expiration_date' => today()->addMonths(6),
    ]);
    $service = Service::factory()->recycle($serviceCategory)->create();

    $this->actingAs($user)
        ->post(route('pos.checkout'), [
            'branch_ID' => $branch->branch_ID,
            'PID' => $patient->PID,
            'customer_name' => $patient->full_name,
            'discount_percentage' => 10,
            'payment_method' => 'cash',
            'amount_received' => 1300,
            'products' => [['product_ID' => $earlyBatch->product_ID, 'quantity' => 4]],
            'services' => [['service_ID' => $service->service_ID, 'quantity' => 2, 'custom_price' => 500]],
            'subtotal' => 1,
            'total_cost' => 1,
        ])
        ->assertSessionHasNoErrors();

    $sale = Sale::query()->with(['productItems', 'serviceItems'])->sole();

    expect($sale)
        ->PID->toBe($patient->PID)
        ->subtotal_cost->toBe('1400.00')
        ->discount_amount->toBe('140.00')
        ->total_cost->toBe('1260.00')
        ->change_amount->toBe('40.00')
        ->and($sale->productItems)->toHaveCount(2)
        ->and($sale->productItems->pluck('quantity')->all())->toBe([2, 2])
        ->and($sale->productItems->pluck('unit_price')->all())->toBe(['100.00', '100.00'])
        ->and($earlyBatch->refresh()->quantity)->toBe(0)
        ->and($laterBatch->refresh()->quantity)->toBe(3);
});

test('checkout prevents overselling and insufficient cash payments', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $product = Product::factory()->recycle([$branch, $category])->create([
        'price' => 200,
        'quantity' => 2,
        'expiration_date' => today()->addYear(),
    ]);

    $payload = [
        'branch_ID' => $branch->branch_ID,
        'customer_name' => 'Walk-in Customer',
        'discount_percentage' => 0,
        'payment_method' => 'cash',
        'amount_received' => 100,
        'products' => [['product_ID' => $product->product_ID, 'quantity' => 2]],
        'services' => [],
    ];

    $this->actingAs($user)->post(route('pos.checkout'), $payload)
        ->assertSessionHasErrors('amount_received');

    $payload['amount_received'] = 5000;
    $payload['products'][0]['quantity'] = 3;
    $this->actingAs($user)->post(route('pos.checkout'), $payload)
        ->assertSessionHasErrors('products.0.quantity');

    expect(Sale::query()->count())->toBe(0)
        ->and($product->refresh()->quantity)->toBe(2);
});

test('partial returns apply the sale discount and restore product stock', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $product = Product::factory()->recycle([$branch, $category])->create(['quantity' => 5]);
    $sale = Sale::factory()->recycle([$branch, $user])->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $user->account_ID,
        'subtotal_cost' => 200,
        'discount_perc' => 10,
        'discount_amount' => 20,
        'total_cost' => 180,
    ]);
    $item = $sale->productItems()->create([
        'product_ID' => $product->product_ID,
        'product_name' => $product->name,
        'measurement_unit' => $product->measurement_unit,
        'quantity' => 2,
        'unit_price' => 100,
        'line_total' => 200,
    ]);

    $this->actingAs($user)->post(route('pos.sales.returns.store', $sale), [
        'reason' => 'Customer request',
        'refund_method' => 'cash',
        'items' => [['type' => 'product', 'item_ID' => $item->sale_product_item_ID, 'quantity' => 1]],
    ])->assertSessionHasNoErrors();

    $return = $sale->returns()->with('items')->sole();
    expect($return->return_amount)->toBe('90.00')
        ->and($return->items->first()->restocked)->toBeTrue()
        ->and($product->refresh()->quantity)->toBe(6);

    $this->actingAs($user)->post(route('pos.sales.returns.store', $sale), [
        'reason' => 'Duplicate request',
        'refund_method' => 'cash',
        'items' => [['type' => 'product', 'item_ID' => $item->sale_product_item_ID, 'quantity' => 2]],
    ])->assertSessionHasErrors('items.0.quantity');
});

test('voiding a sale records a full return and restores every product', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $product = Product::factory()->recycle([$branch, $category])->create(['quantity' => 3]);
    $sale = Sale::factory()->recycle([$branch, $user])->create([
        'branch_ID' => $branch->branch_ID,
        'branch_name' => $branch->branch_name,
        'processed_by' => $user->account_ID,
        'subtotal_cost' => 300,
        'discount_perc' => 0,
        'discount_amount' => 0,
        'total_cost' => 300,
    ]);
    $sale->productItems()->create([
        'product_ID' => $product->product_ID,
        'product_name' => $product->name,
        'measurement_unit' => $product->measurement_unit,
        'quantity' => 2,
        'unit_price' => 150,
        'line_total' => 300,
    ]);

    $this->actingAs($user)->post(route('pos.sales.void', $sale), [
        'reason' => 'Duplicate charge',
        'refund_method' => 'cash',
    ])->assertSessionHasNoErrors();

    expect($sale->refresh())
        ->is_voided->toBeTrue()
        ->void_reason->toBe('Duplicate charge')
        ->and($sale->returns()->sole()->return_type)->toBe('full')
        ->and($product->refresh()->quantity)->toBe(5);
});

test('expenses and categories can be managed from the POS', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $branch = Branch::factory()->create();

    $this->actingAs($user)->post(route('pos.expense-categories.store'), [
        'category_name' => 'Medical Waste',
    ])->assertSessionHasNoErrors();

    $category = ExpenseCategory::query()->sole();
    $this->actingAs($user)->post(route('pos.expenses.store'), [
        'branch_ID' => $branch->branch_ID,
        'category_ID' => $category->category_ID,
        'description' => 'Waste collection service',
        'amount' => '750.00',
        'expense_date' => today()->toDateString(),
    ])->assertSessionHasNoErrors();

    $expense = Expense::query()->sole();
    expect($expense)
        ->branch_name->toBe($branch->branch_name)
        ->category_name->toBe('Medical Waste')
        ->amount->toBe('750.00');

    $this->actingAs($user)->delete(route('pos.expenses.destroy', $expense))
        ->assertSessionHasNoErrors();
    expect($expense->fresh()->trashed())->toBeTrue();
});

test('authenticated users can open a printable sale receipt', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $sale = Sale::factory()->recycle($user)->create(['processed_by' => $user->account_ID]);

    $this->actingAs($user)
        ->get(route('pos.sales.receipt', $sale))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pos/receipt')
            ->where('sale.sale_ID', $sale->sale_ID)
            ->where('sale.invoice_number', $sale->invoice_number));
});

test('patient details include products and services purchased through the POS', function () {
    $user = StaffAccount::factory()->superAdmin()->create();
    $patient = Patient::factory()->create();
    $sale = Sale::factory()->recycle([$user, $patient])->create([
        'PID' => $patient->PID,
        'processed_by' => $user->account_ID,
    ]);
    $sale->productItems()->create([
        'product_name' => 'Prescription Cream',
        'quantity' => 2,
        'unit_price' => 250,
        'line_total' => 500,
    ]);
    $sale->serviceItems()->create([
        'service_name' => 'Dermatology Consultation',
        'quantity' => 1,
        'custom_price' => 800,
        'line_total' => 800,
    ]);

    $this->actingAs($user)
        ->get(route('patients.show', $patient))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('posTransactions.0.invoice_number', $sale->invoice_number)
            ->where('posTransactions.0.products.0.name', 'Prescription Cream')
            ->where('posTransactions.0.services.0.name', 'Dermatology Consultation'));
});
