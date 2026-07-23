<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('major_service_categories', function (Blueprint $table) {
            $table->id('major_service_category_ID');
            $table->string('name')->unique();
            $table->text('description');
            $table->timestamps();
        });

        $timestamp = now();

        DB::table('major_service_categories')->insert([
            [
                'major_service_category_ID' => 1,
                'name' => 'Pathological',
                'description' => 'Medical dermatology services focused on diagnosing and treating skin conditions and diseases.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'major_service_category_ID' => 2,
                'name' => 'Aesthetic',
                'description' => 'Clinically guided procedures that improve skin appearance, texture, and overall presentation.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'major_service_category_ID' => 3,
                'name' => 'Cosmetic',
                'description' => 'Beauty-focused treatments and non-medical enhancements for the skin and face.',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ]);

        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('major_service_category_ID')
                ->nullable()
                ->after('category_type')
                ->constrained('major_service_categories', 'major_service_category_ID')
                ->restrictOnDelete();
        });

        DB::table('categories')
            ->where('category_type', 'Service')
            ->update(['major_service_category_ID' => 1]);

        DB::table('categories')
            ->where('category_type', 'Service')
            ->where('category_name', 'Laser Procedures')
            ->update(['major_service_category_ID' => 2]);

        DB::table('categories')
            ->where('category_type', 'Service')
            ->where('category_name', 'Facial Treatments')
            ->update(['major_service_category_ID' => 3]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropConstrainedForeignId('major_service_category_ID');
        });

        Schema::dropIfExists('major_service_categories');
    }
};
