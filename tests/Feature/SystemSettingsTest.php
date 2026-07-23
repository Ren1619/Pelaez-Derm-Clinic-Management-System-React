<?php

use App\Models\ActivityLog;
use App\Models\Branch;
use App\Models\Category;
use App\Models\MajorServiceCategory;
use App\Models\Service;
use App\Models\StaffAccount;
use App\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('the public website uses the configured content without requiring a settings row', function () {
    $response = $this->get(route('home'));

    $response
        ->assertSuccessful()
        ->assertSee('<link rel="icon" href="/favicon.ico" sizes="any">', false)
        ->assertSee('<link rel="icon" href="/favicon.svg" type="image/svg+xml">', false)
        ->assertSee('<link rel="apple-touch-icon" href="/apple-touch-icon.png">', false);

    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->where('settings.business_name', 'Pelaez Dermatology Clinic')
        ->where('settings.services_title', 'Our Services'));

    $this->assertDatabaseEmpty((new SystemSetting)->getTable());
});

test('the landing page exposes services from every major category', function () {
    Service::query()->delete();
    Category::query()->delete();
    MajorServiceCategory::query()->delete();

    $categories = collect(['Aesthetic', 'Cosmetic', 'Pathological'])
        ->map(fn (string $name) => MajorServiceCategory::factory()->create([
            'name' => $name,
        ]));

    $categories->each(function (MajorServiceCategory $majorCategory): void {
        $category = Category::factory()->service()->create([
            'major_service_category_ID' => $majorCategory->major_service_category_ID,
        ]);

        Service::factory()->create([
            'category_ID' => $category->category_ID,
            'name' => $majorCategory->name.' treatment',
        ]);
    });

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('services', 3)
            ->where('serviceCategories', [
                'Aesthetic',
                'Cosmetic',
                'Pathological',
            ])
            ->where('services.0.major_category', 'Aesthetic')
            ->where('services.1.major_category', 'Cosmetic')
            ->where('services.2.major_category', 'Pathological'));
});

test('the uploaded business logo is used for favicon and touch icon links', function () {
    Storage::fake('public');
    $logoPath = 'system-settings/business/clinic-logo.svg';
    Storage::disk('public')->put($logoPath, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    SystemSetting::factory()->create(['business_logo' => $logoPath]);
    $logoUrl = Storage::disk('public')->url($logoPath);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('<link rel="icon" href="'.$logoUrl.'">', false)
        ->assertSee('<link rel="apple-touch-icon" href="'.$logoUrl.'">', false)
        ->assertDontSee('/favicon.ico', false)
        ->assertDontSee('/favicon.svg', false)
        ->assertDontSee('/apple-touch-icon.png', false);
});

test('the landing page provides the original service branch contact and clinic statistics data', function () {
    SystemSetting::factory()->create(['landing_year_started' => 2000]);
    $treatmentCategory = Category::factory()->service()->create(['category_name' => 'Treatments']);
    $consultationCategory = Category::factory()->service()->create(['category_name' => 'Consultations']);
    Service::factory()->for($treatmentCategory, 'category')->create(['name' => 'Acne Treatment']);
    Service::factory()->for($consultationCategory, 'category')->create(['name' => 'Initial Consultation']);
    Branch::factory()->count(5)->sequence(
        ['branch_name' => 'Alpha Clinic'],
        ['branch_name' => 'Bravo Clinic'],
        ['branch_name' => 'Charlie Clinic'],
        ['branch_name' => 'Delta Clinic'],
        ['branch_name' => 'Echo Clinic'],
    )->create();

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('services', 1)
            ->where('services.0.name', 'Acne Treatment')
            ->has('branches', 4)
            ->has('contactBranches', 5)
            ->where('stats.years_experience', now()->year - 2000)
            ->where('stats.branch_count', 5)
            ->where('stats.service_count', 2));
});

test('only super admins can open system settings', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $admin = StaffAccount::factory()->admin()->create();

    $this->actingAs($superAdmin)
        ->get(route('system-settings.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('system-settings/index')
            ->has('settings'));

    $this->actingAs($admin)
        ->get(route('system-settings.index'))
        ->assertForbidden();
});

test('a super admin can update business details and the change is audited', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->post(route('system-settings.update', 'business'), [
            'business_name' => 'Pelaez Skin and Dermatology Clinic',
        ])
        ->assertRedirect();

    expect(SystemSetting::query()->firstOrFail()->business_name)
        ->toBe('Pelaez Skin and Dermatology Clinic');

    expect(ActivityLog::query()
        ->where('context', 'system_settings')
        ->where('actor_ID', $superAdmin->account_ID)
        ->whereIn('action', ['created', 'updated'])
        ->exists())->toBeTrue();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('settings.business_name', 'Pelaez Skin and Dermatology Clinic'));
});

test('business logo uploads replace and remove the previous public file', function () {
    Storage::fake('public');
    Storage::disk('public')->put('system-settings/business/old-logo.png', 'old');
    SystemSetting::factory()->create([
        'business_logo' => 'system-settings/business/old-logo.png',
    ]);
    $superAdmin = StaffAccount::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->post(route('system-settings.update', 'business'), [
            'business_name' => 'Pelaez Dermatology Clinic',
            'business_logo_file' => UploadedFile::fake()->image('new-logo.png', 300, 300),
        ])
        ->assertSessionHasNoErrors();

    $settings = SystemSetting::query()->firstOrFail();
    expect($settings->business_logo)->not->toBeNull();
    Storage::disk('public')->assertExists($settings->business_logo);
    Storage::disk('public')->assertMissing('system-settings/business/old-logo.png');

    $this->actingAs($superAdmin)
        ->post(route('system-settings.update', 'business'), [
            'business_name' => 'Pelaez Dermatology Clinic',
            'remove_business_logo' => true,
        ])
        ->assertSessionHasNoErrors();

    Storage::disk('public')->assertMissing($settings->business_logo);
    expect($settings->refresh()->business_logo)->toBeNull();
});

test('landing content and clinic hours are validated and saved together', function () {
    $superAdmin = StaffAccount::factory()->superAdmin()->create();
    $payload = [
        'landing_primary_tagline' => 'Specialist care for healthy skin',
        'landing_secondary_tagline' => 'Care that fits every stage of life.',
        'landing_year_started' => 1992,
        'landing_about_description' => 'A patient-centered dermatology clinic.',
        'landing_specializations' => ['Clinical Dermatology', '', 'Cosmetic Dermatology'],
        'landing_services_description' => 'Treatments tailored to every patient.',
        'landing_branches_description' => 'Find the clinic nearest you.',
        'landing_contact_description' => 'Talk to our clinic team.',
        'business_email' => 'care@pelaez.test',
        'landing_cta_title' => 'Start your skin-care journey',
        'landing_cta_description' => 'Connect with our clinic today.',
        'footer_days' => 'Monday - Saturday',
        'footer_opens_at' => '08:00',
        'footer_closes_at' => '17:00',
    ];

    $this->actingAs($superAdmin)
        ->post(route('system-settings.update', 'landing'), $payload)
        ->assertSessionHasNoErrors();

    $settings = SystemSetting::query()->firstOrFail();
    expect($settings->landing_specializations)
        ->toBe(['Clinical Dermatology', 'Cosmetic Dermatology'])
        ->and($settings->business_email)->toBe('care@pelaez.test');

    $this->actingAs($superAdmin)
        ->post(route('system-settings.update', 'landing'), [
            ...$payload,
            'landing_primary_tagline' => '<script>alert(1)</script>',
            'footer_closes_at' => '07:00',
        ])
        ->assertSessionHasErrors(['landing_primary_tagline', 'footer_closes_at']);
});

test('service branch and privacy settings drive their public pages', function () {
    SystemSetting::factory()->create([
        'services_title' => 'Dermatology Services',
        'branches_title' => 'Clinic Locations',
        'privacy_title' => 'How We Protect Your Data',
        'privacy_description' => 'We use patient information only for authorized clinic operations.',
    ]);

    $this->get(route('public.services'))->assertInertia(fn (Assert $page) => $page
        ->component('public/services')
        ->where('settings.services_title', 'Dermatology Services'));
    $this->get(route('public.branches'))->assertInertia(fn (Assert $page) => $page
        ->component('public/branches')
        ->where('settings.branches_title', 'Clinic Locations'));
    $this->get(route('public.privacy-notice'))->assertInertia(fn (Assert $page) => $page
        ->component('public/privacy-notice')
        ->where('settings.privacy_title', 'How We Protect Your Data'));
});
