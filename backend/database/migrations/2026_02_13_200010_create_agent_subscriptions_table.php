<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('agent_subscriptions')) {
            return;
        }

        Schema::create('agent_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_profile_id')->constrained()->cascadeOnDelete();
            $table->string('tier');
            $table->bigInteger('amount_kobo');
            $table->string('payment_reference')->nullable();
            $table->string('payment_provider')->nullable();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->enum('status', ['active', 'expired', 'cancelled', 'refunded'])->default('active');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('agent_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_subscriptions');
    }
};
