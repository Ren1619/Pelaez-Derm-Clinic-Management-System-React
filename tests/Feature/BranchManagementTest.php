<?php

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from branch management', function () {
    $this->get(route('branches.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view and search branches', function () {
    $user = User::factory()->create();
    Branch::factory()->create([
        'branch_name' => 'Valencia City',
        'branch_location' => 'Roxas Street, Valencia City, Bukidnon',
    ]);
    Branch::factory()->create([
        'branch_name' => 'Malaybalay City',
        'branch_location' => 'Fortich Street, Malaybalay City, Bukidnon',
    ]);

    $this->actingAs($user)
        ->get(route('branches.index', ['search' => 'Valencia']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('branches/index')
            ->where('filters.search', 'Valencia')
            ->where('totalBranches', 2)
            ->has('branches.data', 1)
            ->where('branches.data.0.branch_name', 'Valencia City'));
});

test('branch image URLs are host independent', function () {
    $user = User::factory()->create();
    Branch::factory()->create([
        'branch_name' => 'Valencia City',
        'branch_img' => 'branches/valencia.jpg',
    ]);

    $this->actingAs($user)
        ->withServerVariables(['HTTP_HOST' => 'clinic.test'])
        ->get(route('branches.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where(
                'branches.data.0.image_url',
                '/storage/branches/valencia.jpg',
            ));
});

test('public branch image URLs are host independent', function () {
    Branch::factory()->create([
        'branch_name' => 'Valencia City',
        'branch_img' => 'branches/valencia.jpg',
    ]);

    $this->withServerVariables(['HTTP_HOST' => 'clinic.test'])
        ->get(route('public.branches'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where(
                'branches.0.image_url',
                '/storage/branches/valencia.jpg',
            ));
});

test('authenticated users can create a branch with an image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $image = UploadedFile::fake()->image('valencia.jpg', 800, 600)->size(1024);

    $this->actingAs($user)
        ->from(route('branches.index'))
        ->post(route('branches.store'), [
            'branch_name' => 'Valencia City',
            'branch_location' => 'Roxas Street, Valencia City, Bukidnon',
            'latitude' => 7.9075,
            'longitude' => 125.0942,
            'contact_number' => '09353719162',
            'fb_link' => 'https://facebook.com/valencia-clinic',
            'branch_img' => $image,
        ])
        ->assertRedirect(route('branches.index'))
        ->assertSessionHasNoErrors();

    $branch = Branch::query()->where('branch_name', 'Valencia City')->firstOrFail();

    expect($branch->branch_location)->toBe('Roxas Street, Valencia City, Bukidnon');
    expect($branch->latitude)->toBe(7.9075)
        ->and($branch->longitude)->toBe(125.0942)
        ->and($branch->map_link)->toBe(
            'https://www.google.com/maps/search/?api=1&query=7.9075,125.0942',
        );
    Storage::disk('public')->assertExists($branch->branch_img);
});

test('branch images allow up to twenty megabytes', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('branches.store'), [
            'branch_name' => 'Twenty MB Branch',
            'branch_location' => 'Roxas Street, Valencia City, Bukidnon',
            'latitude' => 7.9075,
            'longitude' => 125.0942,
            'contact_number' => '09353719162',
            'branch_img' => UploadedFile::fake()->image('branch.jpg')->size(20 * 1024),
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->from(route('branches.index'))
        ->post(route('branches.store'), [
            'branch_name' => 'Oversized Branch',
            'branch_location' => 'Fortich Street, Malaybalay City, Bukidnon',
            'latitude' => 8.1575,
            'longitude' => 125.1277,
            'contact_number' => '09353719163',
            'branch_img' => UploadedFile::fake()->image('oversized.jpg')->size((20 * 1024) + 1),
        ])
        ->assertRedirect(route('branches.index'))
        ->assertSessionHasErrors('branch_img');
});

test('branch input is validated', function () {
    $user = User::factory()->create();
    Branch::factory()->create(['branch_name' => 'Valencia City']);

    $this->actingAs($user)
        ->from(route('branches.index'))
        ->post(route('branches.store'), [
            'branch_name' => 'Valencia City',
            'branch_location' => '<script>alert(1)</script>',
            'latitude' => 100,
            'longitude' => 200,
            'contact_number' => '1234',
        ])
        ->assertRedirect(route('branches.index'))
        ->assertSessionHasErrors([
            'branch_name',
            'branch_location',
            'latitude',
            'longitude',
            'contact_number',
        ]);
});

test('authenticated users can update a branch and replace its image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('branches/old.jpg', 'old image');

    $user = User::factory()->create();
    $branch = Branch::factory()->create([
        'branch_name' => 'Old Branch',
        'branch_img' => 'branches/old.jpg',
    ]);
    $newImage = UploadedFile::fake()->image('new.png', 800, 600)->size(1024);

    $this->actingAs($user)
        ->from(route('branches.index'))
        ->put(route('branches.update', $branch), [
            'branch_name' => 'Updated Branch',
            'branch_location' => 'Roxas Street, Valencia City, Bukidnon',
            'latitude' => 7.9075,
            'longitude' => 125.0942,
            'contact_number' => '09353719162',
            'fb_link' => null,
            'branch_img' => $newImage,
        ])
        ->assertRedirect(route('branches.index'))
        ->assertSessionHasNoErrors();

    $branch->refresh();

    expect($branch->branch_name)->toBe('Updated Branch');
    Storage::disk('public')->assertMissing('branches/old.jpg');
    Storage::disk('public')->assertExists($branch->branch_img);
});

test('authenticated users can delete a branch and its image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('branches/delete-me.jpg', 'branch image');

    $user = User::factory()->create();
    $branch = Branch::factory()->create([
        'branch_img' => 'branches/delete-me.jpg',
    ]);

    $this->actingAs($user)
        ->from(route('branches.index'))
        ->delete(route('branches.destroy', $branch))
        ->assertRedirect(route('branches.index'));

    $this->assertModelMissing($branch);
    Storage::disk('public')->assertMissing('branches/delete-me.jpg');
});
