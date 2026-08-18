<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->string('landing_services_title')
                ->default('Exceptional treatments, designed for you.')
                ->after('landing_secondary_tagline');
            $table->string('landing_about_title')
                ->default('Years of experience, devoted to you.')
                ->after('landing_services_title');
            $table->string('landing_branches_title')
                ->default('Find Us Near You.')
                ->after('landing_about_title');
            $table->string('landing_contact_title')
                ->default('Connect With Us')
                ->after('landing_branches_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn([
                'landing_services_title',
                'landing_about_title',
                'landing_branches_title',
                'landing_contact_title',
            ]);
        });
    }
};
