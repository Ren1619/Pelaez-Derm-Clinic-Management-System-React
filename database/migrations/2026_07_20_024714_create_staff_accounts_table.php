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
        Schema::create('staff_accounts', function (Blueprint $table) {
            $table->id('account_ID');
            $table->foreignId('branch_ID')->nullable()->constrained('branches', 'branch_ID')->nullOnDelete();
            $table->foreignId('role_ID')->constrained('account_roles', 'role_ID')->restrictOnDelete();
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('contact_number', 11);
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('password');
            $table->rememberToken();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->timestamps();

            $table->index(['first_name', 'last_name', 'email']);
            $table->index(['branch_ID', 'is_active']);
            $table->index(['role_ID', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_accounts');
    }
};
