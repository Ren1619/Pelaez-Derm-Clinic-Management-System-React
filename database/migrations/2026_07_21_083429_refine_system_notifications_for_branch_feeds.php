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
        Schema::table('system_notifications', function (Blueprint $table) {
            $table->string('deduplication_key')->nullable()->unique()->after('type');
        });

        Schema::create('system_notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('system_notification_id')
                ->constrained('system_notifications')
                ->cascadeOnDelete();
            $table->string('viewer_type', 20);
            $table->unsignedBigInteger('viewer_id');
            $table->timestamp('seen_at');
            $table->timestamps();

            $table->unique(
                ['system_notification_id', 'viewer_type', 'viewer_id'],
                'system_notification_viewer_unique',
            );
            $table->index(['viewer_type', 'viewer_id', 'seen_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_notification_reads');

        Schema::table('system_notifications', function (Blueprint $table) {
            $table->dropUnique(['deduplication_key']);
            $table->dropColumn('deduplication_key');
        });
    }
};
