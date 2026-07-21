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
        Schema::create('services', function (Blueprint $table) {
            $table->id('service_ID');
            $table->foreignId('category_ID')
                ->constrained('categories', 'category_ID')
                ->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->longText('service_img')->nullable();
            $table->timestamps();

            $table->index('name');
            $table->unique(['category_ID', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
