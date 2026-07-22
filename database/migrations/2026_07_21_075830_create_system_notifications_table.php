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
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->string('sender_type', 20);
            $table->unsignedBigInteger('receiver_id')->nullable();
            $table->string('receiver_type', 20);
            $table->foreignId('branch_id')->nullable()->constrained('branches', 'branch_ID')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments', 'appointment_ID')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title');
            $table->text('message');
            $table->text('reason')->nullable();
            $table->boolean('is_read')->default(false);
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index(['receiver_type', 'receiver_id', 'is_read']);
            $table->index(['sender_type', 'sender_id']);
            $table->index(['branch_id', 'created_at']);
            $table->index(['type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_notifications');
    }
};
