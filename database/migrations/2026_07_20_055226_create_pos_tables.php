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
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id('category_ID');
            $table->string('category_name')->unique();
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id('sale_ID');
            $table->string('invoice_number')->unique();
            $table->foreignId('branch_ID')->nullable()->constrained('branches', 'branch_ID')->nullOnDelete();
            $table->string('branch_name');
            $table->foreignId('PID')->nullable()->constrained('patients', 'PID')->nullOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->date('date')->index();
            $table->decimal('subtotal_cost', 12, 2);
            $table->decimal('discount_perc', 5, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_cost', 12, 2);
            $table->string('pay_method', 20);
            $table->decimal('amount_received', 12, 2)->nullable();
            $table->decimal('change_amount', 12, 2)->nullable();
            $table->boolean('finalized')->default(true);
            $table->boolean('is_voided')->default(false);
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('void_reason', 500)->nullable();
            $table->timestamps();

            $table->index(['branch_ID', 'date']);
            $table->index(['finalized', 'is_voided', 'date']);
        });

        Schema::create('sale_product_items', function (Blueprint $table) {
            $table->id('sale_product_item_ID');
            $table->foreignId('sale_ID')->constrained('sales', 'sale_ID')->cascadeOnDelete();
            $table->foreignId('product_ID')->nullable()->constrained('products', 'product_ID')->nullOnDelete();
            $table->string('product_name');
            $table->string('measurement_unit')->nullable();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
            $table->index(['sale_ID', 'product_ID']);
        });

        Schema::create('sale_service_items', function (Blueprint $table) {
            $table->id('sale_service_item_ID');
            $table->foreignId('sale_ID')->constrained('sales', 'sale_ID')->cascadeOnDelete();
            $table->foreignId('service_ID')->nullable()->constrained('services', 'service_ID')->nullOnDelete();
            $table->string('service_name');
            $table->unsignedInteger('quantity');
            $table->decimal('custom_price', 12, 2);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();
            $table->index(['sale_ID', 'service_ID']);
        });

        Schema::create('sale_returns', function (Blueprint $table) {
            $table->id('return_ID');
            $table->foreignId('sale_ID')->constrained('sales', 'sale_ID')->cascadeOnDelete();
            $table->string('return_type', 20);
            $table->decimal('return_amount', 12, 2);
            $table->string('return_reason');
            $table->string('refund_method', 20);
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['sale_ID', 'created_at']);
        });

        Schema::create('sale_return_items', function (Blueprint $table) {
            $table->id('return_item_ID');
            $table->foreignId('return_ID')->constrained('sale_returns', 'return_ID')->cascadeOnDelete();
            $table->string('item_type', 20);
            $table->unsignedBigInteger('sale_item_ID');
            $table->string('item_name');
            $table->unsignedInteger('quantity_returned');
            $table->decimal('item_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->boolean('restocked')->default(false);
            $table->timestamps();
            $table->index(['item_type', 'sale_item_ID']);
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id('expense_ID');
            $table->foreignId('branch_ID')->nullable()->constrained('branches', 'branch_ID')->nullOnDelete();
            $table->string('branch_name');
            $table->foreignId('category_ID')->nullable()->constrained('expense_categories', 'category_ID')->nullOnDelete();
            $table->string('category_name');
            $table->foreignId('account_ID')->nullable()->constrained('users')->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->date('expense_date')->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['branch_ID', 'expense_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('sale_return_items');
        Schema::dropIfExists('sale_returns');
        Schema::dropIfExists('sale_service_items');
        Schema::dropIfExists('sale_product_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('expense_categories');
    }
};
