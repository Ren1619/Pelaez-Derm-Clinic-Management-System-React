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
        Schema::create('new_record_events', function (Blueprint $table) {
            $table->id();
            $table->string('module', 50);
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            $table->foreignId('branch_id')->nullable()->constrained('branches', 'branch_ID')->cascadeOnDelete();
            $table->foreignId('secondary_branch_id')->nullable()->constrained('branches', 'branch_ID')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['subject_type', 'subject_id']);
            $table->index(['module', 'created_at']);
            $table->index(['module', 'branch_id', 'created_at']);
            $table->index(['module', 'secondary_branch_id', 'created_at'], 'new_record_events_secondary_branch_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_record_events');
    }
};
