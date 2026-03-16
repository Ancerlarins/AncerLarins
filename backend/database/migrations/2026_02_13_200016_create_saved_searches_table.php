<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('saved_searches')) {
            return;
        }

        Schema::create('saved_searches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('listing_type')->nullable();
            $table->uuid('property_type_id')->nullable();
            $table->uuid('city_id')->nullable();
            $table->json('area_ids')->nullable();
            $table->bigInteger('min_price_kobo')->nullable();
            $table->bigInteger('max_price_kobo')->nullable();
            $table->unsignedSmallInteger('min_bedrooms')->nullable();
            $table->unsignedSmallInteger('max_bedrooms')->nullable();
            $table->string('furnishing')->nullable();
            $table->json('additional_filters')->nullable();
            $table->boolean('notify_push')->default(false);
            $table->boolean('notify_whatsapp')->default(false);
            $table->boolean('notify_email')->default(false);
            $table->enum('frequency', ['instant', 'daily', 'weekly'])->default('daily');
            $table->timestampTz('last_notified_at')->nullable();
            $table->unsignedInteger('match_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->foreign('property_type_id')->references('id')->on('property_types')->nullOnDelete();
            $table->foreign('city_id')->references('id')->on('cities')->nullOnDelete();

            $table->index('user_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_searches');
    }
};
