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
            ->where('services.0.category', 'Laser Procedures')
            ->where('services.0.major_category', 'Laser Treatments')
            ->where('majorCategories.0', 'Acne Care')
            ->where('majorCategories.3', 'Laser Treatments'));
});

test('the public catalogue can be empty', function () {
    $this->get(route('public.services'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/services')
            ->has('services', 0));
});

test('the landing page can show an empty service preview', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('services', 0));
});
