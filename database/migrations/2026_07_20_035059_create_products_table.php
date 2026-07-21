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
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_ID');
            $table->foreignId('category_ID')
                ->constrained('categories', 'category_ID')
                ->cascadeOnDelete();
            $table->foreignId('branch_ID')
                ->constrained('branches', 'branch_ID')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('measurement_unit', 50);
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('quantity');
            $table->date('expiration_date')->nullable();
            $table->longText('product_img')->nullable();
            $table->timestamps();

            $table->unique(['name', 'branch_ID', 'expiration_date']);
            $table->index(['branch_ID', 'quantity']);
            $table->index('category_ID');
            $table->index(['expiration_date', 'quantity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
