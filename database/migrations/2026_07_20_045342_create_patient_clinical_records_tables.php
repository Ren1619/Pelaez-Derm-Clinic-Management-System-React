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
        Schema::create('patient_allergies', function (Blueprint $table) {
            $table->id('allergy_ID');
            $table->foreignId('PID')->constrained('patients', 'PID')->cascadeOnDelete();
            $table->string('allergy');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['PID', 'allergy']);
        });

        Schema::create('patient_medical_conditions', function (Blueprint $table) {
            $table->id('medical_condition_ID');
            $table->foreignId('PID')->constrained('patients', 'PID')->cascadeOnDelete();
            $table->string('condition');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['PID', 'condition']);
        });

        Schema::create('patient_medications', function (Blueprint $table) {
            $table->id('medication_ID');
            $table->foreignId('PID')->constrained('patients', 'PID')->cascadeOnDelete();
            $table->string('medication');
            $table->string('dosage')->nullable();
            $table->string('frequency')->nullable();
            $table->string('duration')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['PID', 'medication']);
        });

        Schema::create('patient_visits', function (Blueprint $table) {
            $table->id('visit_ID');
            $table->foreignId('PID')->constrained('patients', 'PID')->cascadeOnDelete();
            $table->foreignId('branch_ID')->nullable()->constrained('branches', 'branch_ID')->nullOnDelete();
            $table->foreignId('doctor_account_ID')->nullable()->constrained('staff_accounts', 'account_ID')->nullOnDelete();
            $table->string('branch_name');
            $table->string('doctor_name')->nullable();
            $table->dateTime('visited_at');
            $table->string('blood_pressure', 20)->nullable();
            $table->decimal('weight', 6, 2)->nullable();
            $table->decimal('height', 6, 2)->nullable();
            $table->string('status')->default('in_progress');
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();

            $table->index(['PID', 'visited_at']);
            $table->index(['branch_ID', 'visited_at']);
            $table->index(['doctor_account_ID', 'visited_at']);
        });

        Schema::create('patient_visit_services', function (Blueprint $table) {
            $table->id('visit_service_ID');
            $table->foreignId('visit_ID')->constrained('patient_visits', 'visit_ID')->cascadeOnDelete();
            $table->foreignId('service_ID')->nullable()->constrained('services', 'service_ID')->nullOnDelete();
            $table->string('service_name');
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['visit_ID', 'service_ID']);
        });

        Schema::create('patient_visit_products', function (Blueprint $table) {
            $table->id('visit_product_ID');
            $table->foreignId('visit_ID')->constrained('patient_visits', 'visit_ID')->cascadeOnDelete();
            $table->foreignId('product_ID')->nullable()->constrained('products', 'product_ID')->nullOnDelete();
            $table->string('product_name');
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['visit_ID', 'product_ID']);
        });

        Schema::create('patient_visit_diagnoses', function (Blueprint $table) {
            $table->id('diagnosis_ID');
            $table->foreignId('visit_ID')->constrained('patient_visits', 'visit_ID')->cascadeOnDelete();
            $table->string('diagnosis');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['visit_ID', 'diagnosis']);
        });

        Schema::create('patient_visit_prescriptions', function (Blueprint $table) {
            $table->id('prescription_ID');
            $table->foreignId('visit_ID')->constrained('patient_visits', 'visit_ID')->cascadeOnDelete();
            $table->string('prescription');
            $table->string('dosage')->nullable();
            $table->string('frequency')->nullable();
            $table->string('duration')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['visit_ID', 'prescription']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_visit_prescriptions');
        Schema::dropIfExists('patient_visit_diagnoses');
        Schema::dropIfExists('patient_visit_products');
        Schema::dropIfExists('patient_visit_services');
        Schema::dropIfExists('patient_visits');
        Schema::dropIfExists('patient_medications');
        Schema::dropIfExists('patient_medical_conditions');
        Schema::dropIfExists('patient_allergies');
    }
};
