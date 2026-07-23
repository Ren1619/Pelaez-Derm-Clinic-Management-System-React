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
        Schema::create('new_record_event_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('new_record_event_id')->constrained('new_record_events')->cascadeOnDelete();
            $table->string('viewer_type', 20);
            $table->unsignedBigInteger('viewer_id');
            $table->timestamp('seen_at');
            $table->timestamps();

            $table->unique(
                ['new_record_event_id', 'viewer_type', 'viewer_id'],
                'new_record_event_viewer_unique',
            );
            $table->index(['viewer_type', 'viewer_id', 'seen_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_record_event_reads');
    }
};
