<?php

use App\Models\Category;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ServiceSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from service management', function () {
    $this->get(route('services.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view and search services by name or category', function () {
    $user = User::factory()->create();
    $laserCategory = Category::factory()->service()->create([
        'category_name' => 'Laser Procedures',
    ]);
    $facialCategory = Category::factory()->service()->create([
        'category_name' => 'Facial Treatments',
    ]);
    Category::factory()->product()->create(['category_name' => 'Sunscreen']);
    Service::factory()->for($laserCategory, 'category')->create([
        'name' => 'CO2 Resurfacing',
    ]);
    Service::factory()->for($facialCategory, 'category')->create([
        'name' => 'Hydra Facial',
    ]);

    $this->actingAs($user)
        ->get(route('services.index', ['search' => 'Laser']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('services/index')
            ->where('filters.search', 'Laser')
            ->where('totalServices', 2)
            ->has('categories', 2)
            ->has('services.data', 1)
            ->where('services.data.0.name', 'CO2 Resurfacing')
            ->where('services.data.0.category.category_name', 'Laser Procedures'));
});

test('authenticated users can create a service with an image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $category = Category::factory()->service()->create();
    $image = UploadedFile::fake()->image('hydra-facial.webp', 800, 600)->size(1024);

    $this->actingAs($user)
        ->from(route('services.index'))
        ->post(route('services.store'), [
            'category_ID' => $category->category_ID,
            'name' => '  Hydra   Facial  ',
            'description' => '  A deeply hydrating facial treatment.  ',
            'new_image' => $image,
        ])
        ->assertRedirect(route('services.index'))
        ->assertSessionHasNoErrors();

    $service = Service::query()->where('name', 'Hydra Facial')->firstOrFail();

    expect($service->description)->toBe('A deeply hydrating facial treatment.');
    Storage::disk('public')->assertExists($service->service_img);
});

test('service input and category type are validated', function () {
    $user = User::factory()->create();
    $productCategory = Category::factory()->product()->create();

    $this->actingAs($user)
        ->from(route('services.index'))
        ->post(route('services.store'), [
            'category_ID' => $productCategory->category_ID,
            'name' => '<script>alert(1)</script>',
            'description' => '   ',
            'new_image' => UploadedFile::fake()->create('service.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect(route('services.index'))
        ->assertSessionHasErrors([
            'category_ID',
            'name',
            'description',
            'new_image',
        ]);
});

test('service names are case insensitive unique within their category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->service()->create();
    Service::factory()->for($category, 'category')->create(['name' => 'Hydra Facial']);

    $this->actingAs($user)
        ->from(route('services.index'))
        ->post(route('services.store'), [
            'category_ID' => $category->category_ID,
            'name' => ' hydra facial ',
            'description' => 'Duplicate service.',
        ])
        ->assertRedirect(route('services.index'))
        ->assertSessionHasErrors('name');

    expect(Service::query()->count())->toBe(1);
});

test('the same service name can be used in different categories', function () {
    $user = User::factory()->create();
    $firstCategory = Category::factory()->service()->create();
    $secondCategory = Category::factory()->service()->create();
    Service::factory()->for($firstCategory, 'category')->create(['name' => 'Consultation']);

    $this->actingAs($user)
        ->post(route('services.store'), [
            'category_ID' => $secondCategory->category_ID,
            'name' => 'Consultation',
            'description' => 'A consultation in another category.',
        ])
        ->assertSessionHasNoErrors();

    expect(Service::query()->where('name', 'Consultation')->count())->toBe(2);
});

test('updating a service without an image preserves its current image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('services/existing.jpg', 'existing image');

    $user = User::factory()->create();
    $category = Category::factory()->service()->create();
    $service = Service::factory()->for($category, 'category')->create([
        'name' => 'Old Service',
        'service_img' => 'services/existing.jpg',
    ]);

    $this->actingAs($user)
        ->from(route('services.index'))
        ->put(route('services.update', $service), [
            'category_ID' => $category->category_ID,
            'name' => 'Updated Service',
            'description' => 'An updated service description.',
        ])
        ->assertRedirect(route('services.index'))
        ->assertSessionHasNoErrors();

    expect($service->refresh())
        ->name->toBe('Updated Service')
        ->service_img->toBe('services/existing.jpg');
    Storage::disk('public')->assertExists('services/existing.jpg');
});

test('updating a service can replace its image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('services/old.jpg', 'old image');

    $user = User::factory()->create();
    $category = Category::factory()->service()->create();
    $service = Service::factory()->for($category, 'category')->create([
        'service_img' => 'services/old.jpg',
    ]);
    $newImage = UploadedFile::fake()->image('new.png', 800, 600)->size(1024);

    $this->actingAs($user)
        ->from(route('services.index'))
        ->put(route('services.update', $service), [
            'category_ID' => $category->category_ID,
            'name' => 'Updated Laser Service',
            'description' => 'An updated service description.',
            'new_image' => $newImage,
        ])
        ->assertRedirect(route('services.index'))
        ->assertSessionHasNoErrors();

    $service->refresh();

    Storage::disk('public')->assertMissing('services/old.jpg');
    Storage::disk('public')->assertExists($service->service_img);
});

test('authenticated users can delete a service and its image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('services/delete-me.jpg', 'service image');

    $user = User::factory()->create();
    $service = Service::factory()->create([
        'service_img' => 'services/delete-me.jpg',
    ]);

    $this->actingAs($user)
        ->from(route('services.index'))
        ->delete(route('services.destroy', $service))
        ->assertRedirect(route('services.index'));

    $this->assertModelMissing($service);
    Storage::disk('public')->assertMissing('services/delete-me.jpg');
});

test('deleting a category cascades to its services', function () {
    $category = Category::factory()->service()->create();
    $service = Service::factory()->for($category, 'category')->create();

    $category->delete();

    $this->assertModelMissing($service);
});

test('the source services seed with the final schema and category relationships', function () {
    $this->seed(CategorySeeder::class);
    $this->seed(ServiceSeeder::class);

    expect(Service::query()->count())->toBe(6)
        ->and(Service::query()->whereHas('category', fn ($query) => $query
            ->where('category_type', 'Service'))->count())->toBe(6)
        ->and(Schema::hasColumn('services', 'price'))->toBeFalse();
});
