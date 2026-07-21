<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from inventory management', function () {
    $this->get(route('inventory.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can filter grouped inventory and view statistics', function () {
    $user = User::factory()->create();
    $mainBranch = Branch::factory()->create(['branch_name' => 'Valencia City']);
    $otherBranch = Branch::factory()->create(['branch_name' => 'Malaybalay City']);
    $category = Category::factory()->product()->create(['category_name' => 'Sunscreen']);

    Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Daily Sunscreen',
        'quantity' => 30,
        'expiration_date' => today()->addMonths(2),
    ]);
    Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Low Stock Sunscreen',
        'quantity' => 10,
        'expiration_date' => today()->addMonths(2),
    ]);
    Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Empty Sunscreen',
        'quantity' => 0,
        'expiration_date' => today()->addMonths(2),
    ]);
    Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Expiring Sunscreen',
        'quantity' => 30,
        'expiration_date' => today()->addDays(10),
    ]);
    Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Expired Sunscreen',
        'quantity' => 30,
        'expiration_date' => today()->subDay(),
    ]);
    Product::factory()->recycle([$otherBranch, $category])->create([
        'name' => 'Other Branch Product',
        'quantity' => 5,
        'expiration_date' => today()->addMonths(2),
    ]);

    $this->actingAs($user)
        ->get(route('inventory.index', [
            'status' => 'low-stock',
            'branch_ID' => $mainBranch->branch_ID,
            'search' => 'Sunscreen',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/index')
            ->where('filters.status', 'low-stock')
            ->where('filters.view', 'grouped')
            ->where('filters.branch_ID', $mainBranch->branch_ID)
            ->where('statistics.total', 5)
            ->where('statistics.in_stock', 2)
            ->where('statistics.low_stock', 1)
            ->where('statistics.out_of_stock', 1)
            ->where('statistics.expiring', 1)
            ->where('statistics.expired', 1)
            ->has('inventory.data', 1)
            ->where('inventory.data.0.name', 'Low Stock Sunscreen')
            ->where('inventory.data.0.category.category_name', 'Sunscreen')
            ->where('inventory.data.0.branch.branch_name', 'Valencia City'));
});

test('detailed inventory numbers batches by earliest active expiration', function () {
    $user = User::factory()->create();
    $branch = Branch::factory()->create();
    $category = Category::factory()->product()->create();
    $laterBatch = Product::factory()->recycle([$branch, $category])->create([
        'name' => 'Batch Product',
        'quantity' => 30,
        'expiration_date' => today()->addMonths(4),
    ]);
    $earlierBatch = Product::factory()->recycle([$branch, $category])->create([
        'name' => 'Batch Product',
        'quantity' => 25,
        'expiration_date' => today()->addMonths(2),
    ]);

    $this->actingAs($user)
        ->get(route('inventory.index', ['view' => 'detailed']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.view', 'detailed')
            ->has('inventory.data', 2)
            ->where('inventory.data.0.product_ID', $earlierBatch->product_ID)
            ->where('inventory.data.0.batch_number', 1)
            ->where('inventory.data.0.is_primary', true)
            ->where('inventory.data.1.product_ID', $laterBatch->product_ID)
            ->where('inventory.data.1.batch_number', 2)
            ->where('inventory.data.1.is_primary', false));
});

test('authenticated users can create a main branch product with an image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $mainBranch = Branch::factory()->create(['branch_ID' => 1]);
    $category = Category::factory()->product()->create();
    $image = UploadedFile::fake()->image('product.png', 800, 600)->size(1024);

    $this->actingAs($user)
        ->from(route('inventory.index'))
        ->post(route('inventory.store'), [
            'name' => '  CeraVe   Moisturizing Cream  ',
            'category_ID' => $category->category_ID,
            'branch_ID' => $mainBranch->branch_ID,
            'measurement_unit' => ' pcs ',
            'quantity' => 50,
            'price' => '450.00',
            'expiration_date' => today()->addYear()->toDateString(),
            'new_image' => $image,
        ])
        ->assertRedirect(route('inventory.index'))
        ->assertSessionHasNoErrors();

    $product = Product::query()->where('name', 'CeraVe Moisturizing Cream')->firstOrFail();

    expect($product)
        ->measurement_unit->toBe('pcs')
        ->quantity->toBe(50)
        ->price->toBe('450.00');
    Storage::disk('public')->assertExists($product->product_img);
});

test('product input and main branch restrictions are validated', function () {
    $user = User::factory()->create();
    Branch::factory()->create(['branch_ID' => 1]);
    $otherBranch = Branch::factory()->create(['branch_ID' => 2]);
    $serviceCategory = Category::factory()->service()->create();

    $this->actingAs($user)
        ->from(route('inventory.index'))
        ->post(route('inventory.store'), [
            'name' => '<script>alert(1)</script>',
            'category_ID' => $serviceCategory->category_ID,
            'branch_ID' => $otherBranch->branch_ID,
            'measurement_unit' => 'pcs!',
            'quantity' => -1,
            'price' => '10.999',
            'expiration_date' => today()->toDateString(),
            'new_image' => UploadedFile::fake()->create('product.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect(route('inventory.index'))
        ->assertSessionHasErrors([
            'name',
            'category_ID',
            'branch_ID',
            'measurement_unit',
            'quantity',
            'price',
            'expiration_date',
            'new_image',
        ]);
});

test('creating a matching batch merges quantity and updates price', function () {
    $user = User::factory()->create();
    $mainBranch = Branch::factory()->create(['branch_ID' => 1]);
    $category = Category::factory()->product()->create();
    $expirationDate = today()->addYear()->toDateString();
    $batch = Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Hydrating Cream',
        'quantity' => 20,
        'price' => 100,
        'expiration_date' => $expirationDate,
    ]);

    $this->actingAs($user)
        ->post(route('inventory.store'), [
            'name' => ' hydrating cream ',
            'category_ID' => $category->category_ID,
            'branch_ID' => $mainBranch->branch_ID,
            'measurement_unit' => 'pcs',
            'quantity' => 15,
            'price' => '125.50',
            'expiration_date' => $expirationDate,
        ])
        ->assertSessionHasNoErrors();

    expect(Product::query()->count())->toBe(1)
        ->and($batch->refresh()->quantity)->toBe(35)
        ->and($batch->price)->toBe('125.50');
});

test('restocking creates a new batch or merges a matching expiration', function () {
    $user = User::factory()->create();
    $mainBranch = Branch::factory()->create(['branch_ID' => 1]);
    $category = Category::factory()->product()->create();
    $product = Product::factory()->recycle([$mainBranch, $category])->create([
        'name' => 'Restock Product',
        'quantity' => 10,
        'expiration_date' => today()->addMonths(3),
    ]);
    $newExpirationDate = today()->addMonths(6)->toDateString();

    $this->actingAs($user)
        ->post(route('inventory.restock', $product), [
            'quantity' => 12,
            'price' => '250.00',
            'expiration_date' => $newExpirationDate,
        ])
        ->assertSessionHasNoErrors();

    $newBatch = Product::query()
        ->whereDate('expiration_date', $newExpirationDate)
        ->firstOrFail();

    expect(Product::query()->count())->toBe(2)
        ->and($newBatch->quantity)->toBe(12);

    $this->actingAs($user)
        ->post(route('inventory.restock', $product), [
            'quantity' => 8,
            'price' => '275.00',
            'expiration_date' => $newExpirationDate,
        ])
        ->assertSessionHasNoErrors();

    expect(Product::query()->count())->toBe(2)
        ->and($newBatch->refresh()->quantity)->toBe(20)
        ->and($newBatch->price)->toBe('275.00');
});

test('products outside the main branch cannot be restocked', function () {
    $user = User::factory()->create();
    Branch::factory()->create(['branch_ID' => 1]);
    $otherBranch = Branch::factory()->create(['branch_ID' => 2]);
    $product = Product::factory()->for($otherBranch, 'branch')->create();

    $this->actingAs($user)
        ->post(route('inventory.restock', $product), [
            'quantity' => 5,
            'price' => '100.00',
            'expiration_date' => today()->addYear()->toDateString(),
        ])
        ->assertForbidden();
});

test('updating a batch preserves its branch expiration and image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('products/existing.jpg', 'existing image');

    $user = User::factory()->create();
    $category = Category::factory()->product()->create();
    $product = Product::factory()->create([
        'name' => 'Old Product',
        'category_ID' => $category->category_ID,
        'product_img' => 'products/existing.jpg',
    ]);
    $originalBranchId = $product->branch_ID;
    $originalExpiration = $product->expiration_date?->toDateString();

    $this->actingAs($user)
        ->from(route('inventory.index'))
        ->put(route('inventory.update', $product), [
            'name' => 'Updated Product',
            'category_ID' => $category->category_ID,
            'measurement_unit' => 'tube',
            'quantity' => 18,
            'price' => '725.00',
        ])
        ->assertRedirect(route('inventory.index'))
        ->assertSessionHasNoErrors();

    expect($product->refresh())
        ->name->toBe('Updated Product')
        ->branch_ID->toBe($originalBranchId)
        ->product_img->toBe('products/existing.jpg')
        ->and($product->expiration_date?->toDateString())->toBe($originalExpiration);
    Storage::disk('public')->assertExists('products/existing.jpg');
});

test('updating a batch can replace its image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('products/old.jpg', 'old image');

    $user = User::factory()->create();
    $category = Category::factory()->product()->create();
    $product = Product::factory()->create([
        'category_ID' => $category->category_ID,
        'product_img' => 'products/old.jpg',
    ]);

    $this->actingAs($user)
        ->put(route('inventory.update', $product), [
            'name' => 'Updated Image Product',
            'category_ID' => $category->category_ID,
            'measurement_unit' => 'pcs',
            'quantity' => 12,
            'price' => '300.00',
            'new_image' => UploadedFile::fake()->image('new.png', 800, 600),
        ])
        ->assertSessionHasNoErrors();

    $product->refresh();

    Storage::disk('public')->assertMissing('products/old.jpg');
    Storage::disk('public')->assertExists($product->product_img);
});

test('authenticated users can delete a batch and its image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('products/delete-me.jpg', 'product image');

    $user = User::factory()->create();
    $product = Product::factory()->create([
        'product_img' => 'products/delete-me.jpg',
    ]);

    $this->actingAs($user)
        ->from(route('inventory.index'))
        ->delete(route('inventory.destroy', $product))
        ->assertRedirect(route('inventory.index'));

    $this->assertModelMissing($product);
    Storage::disk('public')->assertMissing('products/delete-me.jpg');
});

test('the source inventory seeds with its final consolidated schema', function () {
    $this->seed(BranchSeeder::class);
    $this->seed(CategorySeeder::class);
    $this->seed(ProductSeeder::class);

    expect(Product::query()->count())->toBe(5)
        ->and(Product::query()->where('branch_ID', 1)->count())->toBe(3)
        ->and(Product::query()->where('branch_ID', 2)->count())->toBe(2)
        ->and(Product::query()->whereHas('category', fn ($query) => $query
            ->where('category_type', 'Product'))->count())->toBe(5)
        ->and(Schema::hasColumns('products', [
            'product_ID',
            'category_ID',
            'branch_ID',
            'name',
            'measurement_unit',
            'price',
            'quantity',
            'expiration_date',
            'product_img',
        ]))->toBeTrue();
});
