<?php

use App\Models\Category;
use App\Models\MajorServiceCategory;
use App\Models\Service;
use Inertia\Testing\AssertableInertia as Assert;

test('the public catalogue provides categories beneath their major category', function () {
    $majorCategory = MajorServiceCategory::factory()->create([
        'name' => 'Laser Treatments',
    ]);
    MajorServiceCategory::factory()->create([
        'name' => 'Acne Care',
    ]);
    $category = Category::factory()->service()->create([
        'category_name' => 'Laser Procedures',
        'major_service_category_ID' => $majorCategory->major_service_category_ID,
    ]);
    Service::factory()->for($category, 'category')->create([
        'name' => 'Laser Toning',
    ]);

    $this->get(route('public.services'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/services')
            ->where('services.data.0.category', 'Laser Procedures')
            ->where('services.data.0.major_category', 'Laser Treatments')
            ->where('services.total', 1)
            ->where('majorCategories.0.name', 'Acne Care')
            ->where('majorCategories.3.name', 'Laser Treatments')
            ->where('majorCategories.3.count', 1)
            ->where('majorCategories.3.categories.0.name', 'Laser Procedures')
            ->where('filters.major_category', null)
            ->where('filters.category', null));
});

test('the public catalogue can be empty', function () {
    $this->get(route('public.services'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/services')
            ->has('services.data', 0)
            ->where('services.total', 0));
});

test('the public catalogue initially loads twelve services and paginates the rest', function () {
    $category = Category::factory()->service()->create([
        'category_name' => 'Facial Treatments',
    ]);
    Service::factory()->count(13)->for($category, 'category')->create();

    $this->get(route('public.services'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/services')
            ->has('services.data', 12)
            ->where('services.total', 13)
            ->where('services.current_page', 1)
            ->where('services.last_page', 2));

    $this->get(route('public.services', ['page' => 2]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/services')
            ->has('services.data', 1)
            ->where('services.total', 13)
            ->where('services.current_page', 2));
});

test('the public catalogue filters services before paginating', function () {
    $laser = MajorServiceCategory::factory()->create(['name' => 'Laser']);
    $facial = MajorServiceCategory::factory()->create(['name' => 'Facial']);
    $laserCategory = Category::factory()->service()->create([
        'category_name' => 'Laser Procedures',
        'major_service_category_ID' => $laser->major_service_category_ID,
    ]);
    $facialCategory = Category::factory()->service()->create([
        'category_name' => 'Facial Procedures',
        'major_service_category_ID' => $facial->major_service_category_ID,
    ]);
    Service::factory()->count(2)->for($laserCategory, 'category')->create();
    Service::factory()->for($facialCategory, 'category')->create();

    $this->get(route('public.services', [
        'major_category' => 'Laser',
        'category' => 'Laser Procedures',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/services')
            ->has('services.data', 2)
            ->where('services.total', 2)
            ->where('services.data.0.major_category', 'Laser')
            ->where('services.data.0.category', 'Laser Procedures')
            ->where('filters.major_category', 'Laser')
            ->where('filters.category', 'Laser Procedures'));
});

test('the landing page can show an empty service preview', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('services', 0));
});
