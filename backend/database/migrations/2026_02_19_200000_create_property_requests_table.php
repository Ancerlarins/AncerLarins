<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_requests')) {
            return;
        }

        Schema::create('property_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('listing_type', ['rent', 'sale', 'short_let']);
            $table->foreignUuid('property_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('area_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('city_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('min_bedrooms')->nullable();
            $table->unsignedSmallInteger('max_bedrooms')->nullable();
            $table->bigInteger('min_price_kobo')->nullable();
            $table->bigInteger('max_price_kobo')->nullable();
            $table->bigInteger('budget_kobo')->nullable();
            $table->date('move_in_date')->nullable();
            $table->json('amenity_preferences')->nullable();
            $table->enum('status', ['active', 'fulfilled', 'expired', 'cancelled'])->default('active');
            $table->unsignedInteger('response_count')->default(0);
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('status');
            $table->index('listing_type');
            $table->index('city_id');
            $table->index('area_id');
            $table->index('user_id');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_requests');
    }
};
