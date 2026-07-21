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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id('appointment_ID');
            $table->foreignId('branch_ID')->nullable()->constrained('branches', 'branch_ID')->nullOnDelete();
            $table->foreignId('PID')->constrained('patients', 'PID')->cascadeOnDelete();
            $table->foreignId('doctor_account_ID')->nullable()->constrained('staff_accounts', 'account_ID')->nullOnDelete();
            $table->foreignId('visit_ID')->nullable()->unique()->constrained('patient_visits', 'visit_ID')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('branch_name');
            $table->string('doctor_name')->nullable();
            $table->dateTime('scheduled_at');
            $table->string('appointment_type');
            $table->text('concern')->nullable();
            $table->string('status')->default('pending');
            $table->text('remarks')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['branch_ID', 'scheduled_at']);
            $table->index(['PID', 'scheduled_at']);
            $table->index(['doctor_account_ID', 'scheduled_at']);
            $table->index(['status', 'scheduled_at']);
        });

        Schema::create('appointment_services', function (Blueprint $table) {
            $table->id('appointment_service_ID');
            $table->foreignId('appointment_ID')->constrained('appointments', 'appointment_ID')->cascadeOnDelete();
            $table->foreignId('service_ID')->nullable()->constrained('services', 'service_ID')->nullOnDelete();
            $table->string('service_name');
            $table->timestamps();

            $table->index(['appointment_ID', 'service_ID']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_services');
        Schema::dropIfExists('appointments');
    }
};
