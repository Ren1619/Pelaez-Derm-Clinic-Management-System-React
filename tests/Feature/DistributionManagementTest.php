<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Distribution;
use App\Models\DistributionItem;
use App\Models\Product;
use App\Models\StaffAccount;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from distribution management', function () {
    $this->get(route('distributions.index'))->assertRedirect(route('login'));
});

test('distribution access follows the staff role matrix', function () {
    $branch = Branch::factory()->create();
    $accounts = [
        StaffAccount::factory()->superAdmin()->create(),
        StaffAccount::factory()->admin()->create(['branch_ID' => $branch->branch_ID]),
        StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]),
    ];

    foreach ($accounts as $account) {
        $this->actingAs($account)->get(route('distributions.index'))->assertSuccessful();
    }

    $doctor = StaffAccount::factory()->doctor()->create(['branch_ID' => $branch->branch_ID]);
    $this->actingAs($doctor)->get(route('distributions.index'))->assertForbidden();
});

test('an admin can schedule a branch distribution without deducting inventory', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $category = Category::factory()->product()->create(['category_name' => 'Skin Care']);
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $source->branch_ID]);
    $product = Product::factory()->recycle([$source, $category])->create([
        'name' => 'Gentle Cleanser',
        'quantity' => 25,
        'price' => 180,
        'expiration_date' => today()->addYear(),
    ]);

    $this->actingAs($admin)
        ->from(route('distributions.index'))
        ->post(route('distributions.store'), [
            'from_branch_ID' => $destination->branch_ID,
            'to_branch_ID' => $destination->branch_ID,
            'scheduled_date' => now()->addDay()->toDateTimeString(),
            'notes' => 'For next week appointments',
            'items' => [['product_ID' => $product->product_ID, 'quantity' => 7]],
        ])
        ->assertRedirect(route('distributions.index'))
        ->assertSessionHasNoErrors();

    $distribution = Distribution::query()->with('items')->firstOrFail();

    expect($distribution)
        ->from_branch_ID->toBe($source->branch_ID)
        ->to_branch_ID->toBe($destination->branch_ID)
        ->created_by->toBe($admin->account_ID)
        ->status->toBe(Distribution::Pending)
        ->and($distribution->items)->toHaveCount(1)
        ->and($distribution->items->first()->product_name)->toBe('Gentle Cleanser')
        ->and($distribution->items->first()->category_name)->toBe('Skin Care')
        ->and($product->refresh()->quantity)->toBe(25);
});

test('ordinary staff can view transfers but cannot create them', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $source->branch_ID]);
    $product = Product::factory()->for($source, 'branch')->create();

    $this->actingAs($staff)
        ->post(route('distributions.store'), [
            'from_branch_ID' => $source->branch_ID,
            'to_branch_ID' => $destination->branch_ID,
            'items' => [['product_ID' => $product->product_ID, 'quantity' => 1]],
        ])
        ->assertForbidden();
});

test('a distribution quantity must be at least one', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $admin = StaffAccount::factory()->admin()->create(['branch_ID' => $source->branch_ID]);
    $product = Product::factory()->for($source, 'branch')->create(['quantity' => 10]);

    $this->actingAs($admin)
        ->from(route('distributions.index'))
        ->post(route('distributions.store'), [
            'from_branch_ID' => $source->branch_ID,
            'to_branch_ID' => $destination->branch_ID,
            'items' => [['product_ID' => $product->product_ID, 'quantity' => 0]],
        ])
        ->assertRedirect(route('distributions.index'))
        ->assertSessionHasErrors('items.0.quantity');

    expect(Distribution::query()->count())->toBe(0);
});

test('sending deducts the exact source batches atomically', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $sourceStaff = StaffAccount::factory()->staff()->create(['branch_ID' => $source->branch_ID]);
    $destinationStaff = StaffAccount::factory()->admin()->create(['branch_ID' => $destination->branch_ID]);
    $product = Product::factory()->recycle([$source, $category])->create(['quantity' => 20]);
    $distribution = Distribution::factory()->create([
        'from_branch_ID' => $source->branch_ID,
        'to_branch_ID' => $destination->branch_ID,
        'created_by' => $sourceStaff->account_ID,
        'status' => Distribution::Pending,
    ]);
    DistributionItem::factory()->create([
        'distribution_ID' => $distribution->distribution_ID,
        'product_ID' => $product->product_ID,
        'category_ID' => $category->category_ID,
        'product_name' => $product->name,
        'category_name' => $category->category_name,
        'measurement_unit' => $product->measurement_unit,
        'quantity' => 6,
        'price' => $product->price,
        'expiration_date' => $product->expiration_date,
    ]);

    $this->actingAs($sourceStaff)
        ->get(route('distributions.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('distributions.data', 1)
            ->where('distributions.data.0.distribution_ID', $distribution->distribution_ID)
            ->where('distributions.data.0.can.send', true));

    $this->actingAs($destinationStaff)
        ->patch(route('distributions.send', $distribution))
        ->assertForbidden();

    $this->actingAs($sourceStaff)
        ->patch(route('distributions.send', $distribution))
        ->assertSessionHasNoErrors();

    expect($product->refresh()->quantity)->toBe(14)
        ->and($distribution->refresh()->status)->toBe(Distribution::InTransit)
        ->and($distribution->sent_date)->not->toBeNull();
});

test('receiving merges stock into a matching destination batch', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $destinationStaff = StaffAccount::factory()->staff()->create(['branch_ID' => $destination->branch_ID]);
    $sourceProduct = Product::factory()->recycle([$source, $category])->create([
        'name' => 'Healing Gel',
        'quantity' => 10,
        'expiration_date' => today()->addMonths(6),
    ]);
    $destinationProduct = Product::factory()->recycle([$destination, $category])->create([
        'name' => $sourceProduct->name,
        'quantity' => 4,
        'expiration_date' => $sourceProduct->expiration_date,
    ]);
    $distribution = Distribution::factory()->inTransit()->create([
        'from_branch_ID' => $source->branch_ID,
        'to_branch_ID' => $destination->branch_ID,
    ]);
    DistributionItem::factory()->create([
        'distribution_ID' => $distribution->distribution_ID,
        'product_ID' => $sourceProduct->product_ID,
        'category_ID' => $category->category_ID,
        'product_name' => $sourceProduct->name,
        'category_name' => $category->category_name,
        'measurement_unit' => $sourceProduct->measurement_unit,
        'quantity' => 6,
        'price' => $sourceProduct->price,
        'expiration_date' => $sourceProduct->expiration_date,
    ]);

    $this->actingAs($destinationStaff)
        ->patch(route('distributions.receive', $distribution))
        ->assertSessionHasNoErrors();

    expect($destinationProduct->refresh()->quantity)->toBe(10)
        ->and(Product::query()->where('branch_ID', $destination->branch_ID)->count())->toBe(1)
        ->and($distribution->refresh()->status)->toBe(Distribution::Delivered)
        ->and($distribution->received_date)->not->toBeNull();
});

test('cancelling an in transit distribution restores source stock', function () {
    $source = Branch::factory()->create();
    $destination = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $source->branch_ID]);
    $product = Product::factory()->recycle([$source, $category])->create(['quantity' => 12]);
    $distribution = Distribution::factory()->inTransit()->create([
        'from_branch_ID' => $source->branch_ID,
        'to_branch_ID' => $destination->branch_ID,
    ]);
    DistributionItem::factory()->create([
        'distribution_ID' => $distribution->distribution_ID,
        'product_ID' => $product->product_ID,
        'category_ID' => $category->category_ID,
        'product_name' => $product->name,
        'category_name' => $category->category_name,
        'measurement_unit' => $product->measurement_unit,
        'quantity' => 5,
        'price' => $product->price,
        'expiration_date' => $product->expiration_date,
    ]);

    $this->actingAs($staff)
        ->patch(route('distributions.cancel', $distribution), [
            'cancellation_reason' => 'Courier issue',
        ])
        ->assertSessionHasNoErrors();

    expect($product->refresh()->quantity)->toBe(17)
        ->and($distribution->refresh()->status)->toBe(Distribution::Cancelled)
        ->and($distribution->cancellation_reason)->toBe('Courier issue');
});

test('branch users only see distributions connected to their branch and direction', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $thirdBranch = Branch::factory()->create();
    $staff = StaffAccount::factory()->staff()->create(['branch_ID' => $branch->branch_ID]);
    Distribution::factory()->create(['from_branch_ID' => $branch->branch_ID, 'to_branch_ID' => $otherBranch->branch_ID]);
    Distribution::factory()->create(['from_branch_ID' => $otherBranch->branch_ID, 'to_branch_ID' => $branch->branch_ID]);
    Distribution::factory()->create(['from_branch_ID' => $otherBranch->branch_ID, 'to_branch_ID' => $thirdBranch->branch_ID]);

    $this->actingAs($staff)
        ->get(route('distributions.index', ['tab' => 'outbound', 'branch_ID' => $otherBranch->branch_ID]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('distributions/index')
            ->where('filters.branch_ID', $branch->branch_ID)
            ->has('branches', 3)
            ->has('distributions.data', 1)
            ->where('counts.outbound', 1)
            ->where('counts.inbound', 1)
            ->where('canCreate', false));
});
