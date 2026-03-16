<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('properties')) {
            return;
        }

        Schema::create('properties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_id')->constrained('agent_profiles')->cascadeOnDelete();
            $table->enum('listing_type', ['rent', 'sale']);
            $table->foreignUuid('property_type_id')->constrained()->restrictOnDelete();

            // Core
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');

            // Pricing (all in kobo)
            $table->bigInteger('price_kobo');
            $table->boolean('price_negotiable')->default(false);
            $table->enum('rent_period', ['yearly', 'monthly', 'quarterly'])->nullable();
            $table->decimal('agency_fee_pct', 5, 2)->nullable();
            $table->bigInteger('caution_fee_kobo')->nullable();
            $table->bigInteger('service_charge_kobo')->nullable();
            $table->bigInteger('legal_fee_kobo')->nullable();

            // Location
            $table->foreignUuid('state_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('city_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('area_id')->constrained()->restrictOnDelete();
            $table->string('address');
            $table->string('landmark_note')->nullable();
            $table->boolean('location_fuzzy')->default(true);

            // Features
            $table->unsignedSmallInteger('bedrooms')->default(0);
            $table->unsignedSmallInteger('bathrooms')->default(0);
            $table->unsignedSmallInteger('toilets')->default(0);
            $table->unsignedSmallInteger('sitting_rooms')->default(0);
            $table->decimal('floor_area_sqm', 10, 2)->nullable();
            $table->decimal('land_area_sqm', 10, 2)->nullable();
            $table->unsignedSmallInteger('floor_number')->nullable();
            $table->unsignedSmallInteger('total_floors')->nullable();
            $table->unsignedSmallInteger('year_built')->nullable();

            // Amenities (boolean flags)
            $table->enum('furnishing', ['furnished', 'semi_furnished', 'unfurnished'])->default('unfurnished');
            $table->unsignedSmallInteger('parking_spaces')->default(0);
            $table->boolean('has_bq')->default(false);
            $table->boolean('has_swimming_pool')->default(false);
            $table->boolean('has_gym')->default(false);
            $table->boolean('has_cctv')->default(false);
            $table->boolean('has_generator')->default(false);
            $table->boolean('has_water_supply')->default(false);
            $table->boolean('has_prepaid_meter')->default(false);
            $table->boolean('is_serviced')->default(false);
            $table->boolean('is_new_build')->default(false);

            // Availability
            $table->date('available_from')->nullable();
            $table->boolean('inspection_available')->default(true);

            // Status & moderation
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'expired', 'rented', 'sold', 'archived'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->boolean('featured')->default(false);
            $table->timestampTz('featured_until')->nullable();

            // SEO
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();

            // Counters
            $table->unsignedInteger('view_count')->default(0);
            $table->unsignedInteger('save_count')->default(0);
            $table->unsignedInteger('contact_count')->default(0);
            $table->unsignedInteger('share_count')->default(0);

            // Phase 2 AI columns
            $table->bigInteger('estimated_value_kobo')->nullable();
            $table->decimal('valuation_confidence', 5, 4)->nullable();
            $table->timestampTz('last_valued_at')->nullable();

            // Lifecycle
            $table->timestampTz('published_at')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            // Foreign keys
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            // Single-column indexes
            $table->index('agent_id');
            $table->index('status');
            $table->index('listing_type');
            $table->index('property_type_id');
            $table->index('price_kobo');
            $table->index('area_id');
            $table->index('city_id');
            $table->index('state_id');
            $table->index('featured');

            // Composite index for browse queries
            $table->index(
                ['status', 'listing_type', 'city_id', 'property_type_id', 'price_kobo'],
                'properties_browse_idx'
            );
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
