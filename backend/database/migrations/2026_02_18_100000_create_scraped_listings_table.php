<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('scraped_listings')) {
            return;
        }

        Schema::create('scraped_listings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source', 50);
            $table->string('source_url', 1000)->unique();
            $table->string('source_id', 200)->nullable();
            $table->json('raw_data');
            $table->string('title', 500);
            $table->bigInteger('price_kobo')->nullable();
            $table->string('location', 300)->nullable();
            $table->unsignedSmallInteger('bedrooms')->nullable();
            $table->string('property_type', 100)->nullable();
            $table->string('listing_type', 10)->nullable();
            $table->string('image_url', 1000)->nullable();
            $table->string('status', 20)->default('pending');
            $table->foreignUuid('matched_property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->decimal('dedup_score', 5, 4)->nullable();
            $table->string('rejection_reason', 500)->nullable();
            $table->timestampsTz();

            $table->index('source');
            $table->index('status');
            $table->index(['source', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scraped_listings');
    }
};
