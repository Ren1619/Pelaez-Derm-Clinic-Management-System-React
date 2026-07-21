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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id('feedback_ID');
            $table->foreignId('appointment_ID')->unique()->constrained('appointments', 'appointment_ID')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['rating', 'created_at']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
