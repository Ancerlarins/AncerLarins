<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Idempotency table for webhook processing.
 * Stores the event ID of every successfully processed webhook so
 * replayed or duplicate deliveries are silently ignored.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('processed_webhooks')) {
            return;
        }

        Schema::create('processed_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 20)->index();           // 'paystack', 'termii'
            $table->string('event_id', 100);                   // provider-specific unique ID
            $table->string('event_type', 60)->nullable();      // 'charge.success', etc.
            $table->timestampTz('processed_at')->useCurrent();

            $table->unique(['provider', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_webhooks');
    }
};
