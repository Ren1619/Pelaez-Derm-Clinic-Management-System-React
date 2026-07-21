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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id('activity_log_ID');
            $table->string('actor_type', 20)->index();
            $table->unsignedBigInteger('actor_ID')->nullable();
            $table->string('actor_name')->default('System');
            $table->string('actor_email')->nullable();
            $table->string('actor_role')->nullable();
            $table->unsignedBigInteger('actor_branch_ID')->nullable()->index();
            $table->string('action', 20)->index();
            $table->string('context', 50)->index();
            $table->string('subject_type');
            $table->string('subject_ID')->nullable();
            $table->string('subject_label')->nullable();
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('request_method', 10)->nullable();
            $table->string('route_name')->nullable();
            $table->text('url')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['actor_type', 'actor_ID']);
            $table->index(['context', 'created_at']);
            $table->index(['subject_type', 'subject_ID']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
