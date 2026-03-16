<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_request_responses')) {
            return;
        }

        Schema::create('property_request_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('property_request_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('agent_id')->constrained('agent_profiles')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained()->nullOnDelete();
            $table->text('message');
            $table->bigInteger('proposed_price_kobo')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->timestampsTz();

            $table->index('property_request_id');
            $table->index('agent_id');
            $table->unique(['property_request_id', 'agent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_request_responses');
    }
};
