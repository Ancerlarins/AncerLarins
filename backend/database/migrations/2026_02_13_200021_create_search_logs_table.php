<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('search_logs')) {
            return;
        }

        Schema::create('search_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('session_id')->nullable();
            $table->string('query_text')->nullable();
            $table->string('listing_type')->nullable();
            $table->uuid('property_type_id')->nullable();
            $table->uuid('city_id')->nullable();
            $table->uuid('area_id')->nullable();
            $table->bigInteger('min_price_kobo')->nullable();
            $table->bigInteger('max_price_kobo')->nullable();
            $table->unsignedSmallInteger('bedrooms')->nullable();
            $table->json('filters_json')->nullable();
            $table->unsignedInteger('result_count')->default(0);
            $table->uuid('clicked_property_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('property_type_id')->references('id')->on('property_types')->nullOnDelete();
            $table->foreign('city_id')->references('id')->on('cities')->nullOnDelete();
            $table->foreign('area_id')->references('id')->on('areas')->nullOnDelete();

            $table->index('created_at');
            $table->index('area_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_logs');
    }
};
