<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name')->default('Pelaez Dermatology Clinic');
            $table->string('business_logo')->nullable();

            $table->string('landing_primary_tagline')->default('Confidence begins with healthy skin');
            $table->string('landing_secondary_tagline')->default('Professional dermatology care made personal.');
            $table->unsignedSmallInteger('landing_year_started')->default(1990);
            $table->string('landing_hero_image')->nullable();
            $table->string('landing_about_image')->nullable();
            $table->text('landing_about_description'); // default moved to model
            $table->json('landing_specializations');
            $table->text('landing_services_description'); // default moved to model
            $table->text('landing_branches_description'); // default moved to model
            $table->text('landing_contact_description'); // default moved to model
            $table->string('business_email')->default('clinic@example.com');
            $table->string('landing_cta_title')->default('Ready to care for your skin?');
            $table->text('landing_cta_description'); // default moved to model
            $table->string('footer_days')->default('Monday - Saturday');
            $table->time('footer_opens_at')->default('08:00');
            $table->time('footer_closes_at')->default('17:00');

            $table->string('services_hero_image')->nullable();
            $table->text('services_hero_description')->nullable();
            $table->string('services_title')->default('Our Services');
            $table->text('services_description')->nullable();

            $table->string('branches_hero_image')->nullable();
            $table->text('branches_hero_description')->nullable();
            $table->string('branches_title')->default('Our Branches');
            $table->text('branches_description')->nullable();

            $table->string('privacy_hero_image')->nullable();
            $table->text('privacy_hero_description')->nullable();
            $table->string('privacy_title')->default('Privacy Notice');
            $table->text('privacy_description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};