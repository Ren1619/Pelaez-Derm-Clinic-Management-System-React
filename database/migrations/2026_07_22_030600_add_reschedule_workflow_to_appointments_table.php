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
        Schema::table('appointments', function (Blueprint $table) {
            $table->dateTime('previous_scheduled_at')->nullable()->after('scheduled_at');
            $table->text('reschedule_reason')->nullable()->after('remarks');
            $table->timestamp('reschedule_requested_at')->nullable()->after('reschedule_reason');
            $table->timestamp('reschedule_responded_at')->nullable()->after('reschedule_requested_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'previous_scheduled_at',
                'reschedule_reason',
                'reschedule_requested_at',
                'reschedule_responded_at',
            ]);
        });
    }
};
