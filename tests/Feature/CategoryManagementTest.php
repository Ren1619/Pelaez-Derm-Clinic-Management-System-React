<?php

use App\Models\Category;
use App\Models\MajorServiceCategory;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from category management', function () {
    $this->get(route('categories.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view product categories and summary counts', function () {
    $user = User::factory()->create();
    Category::factory()->product()->create(['category_name' => 'Moisturizers']);
    Category::factory()->service()->create(['category_name' => 'Consultations']);

    $this->actingAs($user)
        ->get(route('categories.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('categories/index')
            ->where('filters.tab', 'products')
            ->where('summary.products', 1)
            ->where('summary.services', 1)
            ->has('categories.data', 1)
            ->where('categories.data.0.category_name', 'Moisturizers')
            ->where('categories.data.0.category_type', 'Product'));
});

test('categories can be searched within the selected tab', function () {
    $user = User::factory()->create();
    Category::factory()->service()->create(['category_name' => 'Laser Procedures']);
    Category::factory()->service()->create(['category_name' => 'Facial Treatments']);
    Category::factory()->product()->create(['category_name' => 'Laser Cream']);

    $this->actingAs($user)
        ->get(route('categories.index', ['tab' => 'services', 'search' => 'Laser']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.tab', 'services')
            ->where('filters.search', 'Laser')
            ->has('categories.data', 1)
            ->where('categories.data.0.category_name', 'Laser Procedures'));
});

test('authenticated users can create a category', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('categories.index'))
        ->post(route('categories.store'), [
            'category_name' => '  Skin   Care  ',
            'category_type' => 'product',
            'description' => '  Daily skin care products.  ',
        ])
        ->assertRedirect(route('categories.index'))
        ->assertSessionHasNoErrors();

    $category = Category::query()->where('category_name', 'Skin Care')->firstOrFail();

    expect($category)
        ->category_type->toBe('Product')
        ->description->toBe('Daily skin care products.');
});

test('category input is validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('categories.index'))
        ->post(route('categories.store'), [
            'category_name' => '<script>alert(1)</script>',
            'category_type' => 'Unknown',
            'description' => '   ',
        ])
        ->assertRedirect(route('categories.index'))
        ->assertSessionHasErrors([
            'category_name',
            'category_type',
            'description',
        ]);
});

test('category names are case insensitive unique within their type', function () {
    $user = User::factory()->create();
    Category::factory()->product()->create(['category_name' => 'Moisturizers']);

    $this->actingAs($user)
        ->from(route('categories.index'))
        ->post(route('categories.store'), [
            'category_name' => ' moisturizers ',
            'category_type' => 'Product',
            'description' => 'Duplicate product category.',
        ])
        ->assertRedirect(route('categories.index'))
        ->assertSessionHasErrors('category_name');

    expect(Category::query()->count())->toBe(1);
});

test('the same category name can be used by different types', function () {
    $user = User::factory()->create();
    $majorCategory = MajorServiceCategory::factory()->create();
    Category::factory()->product()->create(['category_name' => 'Consultations']);

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'category_name' => 'Consultations',
            'category_type' => 'Service',
            'major_service_category_ID' => $majorCategory->major_service_category_ID,
            'description' => 'Medical and cosmetic consultations.',
        ])
        ->assertSessionHasNoErrors();

    expect(Category::query()->where('category_name', 'Consultations')->count())
        ->toBe(2);
});

test('authenticated users can update a category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->product()->create([
        'category_name' => 'Old Name',
    ]);

    $this->actingAs($user)
        ->from(route('categories.index'))
        ->put(route('categories.update', $category), [
            'category_name' => 'Updated Name',
            'category_type' => 'Product',
            'description' => 'An updated description.',
        ])
        ->assertRedirect(route('categories.index'))
        ->assertSessionHasNoErrors();

    expect($category->refresh())
        ->category_name->toBe('Updated Name')
        ->description->toBe('An updated description.');
});

test('authenticated users can delete a category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->service()->create();

    $this->actingAs($user)
        ->from(route('categories.index'))
        ->delete(route('categories.destroy', $category))
        ->assertRedirect(route('categories.index'));

    $this->assertModelMissing($category);
});

test('the source categories seed with runtime compatible type values', function () {
    $this->seed(CategorySeeder::class);

    expect(Category::query()->where('category_type', 'Product')->count())->toBe(3)
        ->and(Category::query()->where('category_type', 'Service')->count())->toBe(3)
        ->and(MajorServiceCategory::query()->pluck('name')->sort()->values()->all())->toBe([
            'Aesthetic',
            'Cosmetic',
            'Pathological',
        ])
        ->and(Category::query()->where('category_name', 'Consultations')->value('major_service_category_ID'))->toBe(1)
        ->and(Category::query()->where('category_name', 'Laser Procedures')->value('major_service_category_ID'))->toBe(2)
        ->and(Category::query()->where('category_name', 'Facial Treatments')->value('major_service_category_ID'))->toBe(3)
        ->and(Category::query()->whereIn('category_type', ['product', 'service'])->count())->toBe(0);
});
