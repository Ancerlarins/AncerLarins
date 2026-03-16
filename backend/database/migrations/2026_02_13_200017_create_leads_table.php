<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('leads')) {
            return;
        }

        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('property_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('agent_id')->constrained('agent_profiles')->cascadeOnDelete();
            $table->uuid('user_id')->nullable();
            $table->enum('contact_type', ['whatsapp', 'call', 'form']);
            $table->string('source')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->timestampTz('responded_at')->nullable();
            $table->unsignedInteger('response_time_min')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->index('agent_id');
            $table->index('property_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
