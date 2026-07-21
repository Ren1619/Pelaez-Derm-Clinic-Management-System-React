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
        Schema::create('distributions', function (Blueprint $table) {
            $table->id('distribution_ID');
            $table->foreignId('from_branch_ID')->constrained('branches', 'branch_ID')->cascadeOnDelete();
            $table->foreignId('to_branch_ID')->constrained('branches', 'branch_ID')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('staff_accounts', 'account_ID')->nullOnDelete();
            $table->string('status', 20)->default('pending');
            $table->dateTime('scheduled_date')->nullable();
            $table->dateTime('sent_date')->nullable();
            $table->dateTime('received_date')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->index(['from_branch_ID', 'status']);
            $table->index(['to_branch_ID', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('scheduled_date');
        });

        Schema::create('distribution_items', function (Blueprint $table) {
            $table->id('distribution_item_ID');
            $table->foreignId('distribution_ID')->constrained('distributions', 'distribution_ID')->cascadeOnDelete();
            $table->foreignId('product_ID')->nullable()->constrained('products', 'product_ID')->nullOnDelete();
            $table->foreignId('category_ID')->nullable()->constrained('categories', 'category_ID')->nullOnDelete();
            $table->string('product_name');
            $table->string('category_name');
            $table->string('measurement_unit', 50);
            $table->unsignedInteger('quantity');
            $table->decimal('price', 10, 2);
            $table->date('expiration_date')->nullable();
            $table->longText('product_img')->nullable();
            $table->timestamps();

            $table->index(['distribution_ID', 'quantity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distribution_items');
        Schema::dropIfExists('distributions');
    }
};
