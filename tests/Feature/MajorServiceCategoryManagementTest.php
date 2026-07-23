<?php

use App\Models\Category;
use App\Models\MajorServiceCategory;
use App\Models\StaffAccount;

test('only superadmins can create parent categories', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $admin = StaffAccount::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('major-service-categories.store'), [
            'name' => 'Medical',
            'description' => 'Medical dermatology services.',
        ])
        ->assertForbidden();

    $this->actingAs($superAdmin)
        ->post(route('major-service-categories.store'), [
            'name' => '  Medical   Dermatology  ',
            'description' => '  Medical dermatology services.  ',
        ])
        ->assertSessionHasNoErrors();

    expect(MajorServiceCategory::query()->where('name', 'Medical Dermatology')->sole())
        ->name->toBe('Medical Dermatology')
        ->description->toBe('Medical dermatology services.');
});

test('only superadmins can update and delete parent categories', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $admin = StaffAccount::factory()->admin()->create();
    $majorCategory = MajorServiceCategory::factory()->create();

    $this->actingAs($admin)
        ->put(route('major-service-categories.update', $majorCategory), [
            'name' => 'Unauthorized Update',
            'description' => 'This must not be saved.',
        ])
        ->assertForbidden();

    $this->actingAs($admin)
        ->delete(route('major-service-categories.destroy', $majorCategory))
        ->assertForbidden();

    $this->actingAs($superAdmin)
        ->put(route('major-service-categories.update', $majorCategory), [
            'name' => 'Clinical Dermatology',
            'description' => 'Appearance-focused clinical procedures.',
        ])
        ->assertSessionHasNoErrors();

    expect($majorCategory->refresh()->name)->toBe('Clinical Dermatology');

    $this->actingAs($superAdmin)
        ->delete(route('major-service-categories.destroy', $majorCategory))
        ->assertSessionHasNoErrors();

    $this->assertModelMissing($majorCategory);
});

test('a parent category in use cannot be deleted', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $majorCategory = MajorServiceCategory::factory()->create();
    Category::factory()->service()->create([
        'major_service_category_ID' => $majorCategory->major_service_category_ID,
    ]);

    $this->actingAs($superAdmin)
        ->delete(route('major-service-categories.destroy', $majorCategory))
        ->assertSessionHasErrors([
            'major_service_category' => 'Move or delete its service categories before deleting this parent category.',
        ]);

    $this->assertModelExists($majorCategory);
});

test('service categories require a valid parent category while product categories do not', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->post(route('categories.store'), [
            'category_name' => 'Laser Treatments',
            'category_type' => 'Service',
            'description' => 'Laser services.',
        ])
        ->assertSessionHasErrors([
            'major_service_category_ID' => 'Select a parent category for this service category.',
        ]);

    $this->actingAs($superAdmin)
        ->post(route('categories.store'), [
            'category_name' => 'Cleansers',
            'category_type' => 'Product',
            'major_service_category_ID' => 999,
            'description' => 'Skin cleansing products.',
        ])
        ->assertSessionHasNoErrors();

    expect(Category::query()->where('category_name', 'Cleansers')->sole()->major_service_category_ID)
        ->toBeNull();
});
