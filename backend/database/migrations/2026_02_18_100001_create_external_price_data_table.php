<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('external_price_data')) {
            return;
        }

        Schema::create('external_price_data', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source', 50);
            $table->foreignUuid('area_id')->constrained()->cascadeOnDelete();
            $table->string('property_type', 100);
            $table->unsignedSmallInteger('bedrooms')->nullable();
            $table->bigInteger('price_kobo');
            $table->string('listing_type', 10)->default('rent');
            $table->date('data_date');
            $table->json('raw_data')->nullable();
            $table->string('data_quality', 20)->default('medium');
            $table->timestampsTz();

            $table->index(['area_id', 'property_type', 'data_date']);
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_price_data');
    }
};
