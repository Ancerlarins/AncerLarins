<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('estates')) {
            return;
        }

        Schema::create('estates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('area_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('estate_type')->default('gated_estate'); // gated_estate, open_estate, highrise, mixed_use
            $table->string('developer')->nullable();
            $table->unsignedSmallInteger('year_built')->nullable();
            $table->unsignedInteger('total_units')->nullable();
            $table->json('amenities')->nullable();
            $table->string('security_type')->nullable();
            $table->bigInteger('service_charge_kobo')->nullable();
            $table->string('service_charge_period')->nullable(); // monthly, quarterly, annually
            $table->string('electricity_source')->nullable();
            $table->string('water_source')->nullable();
            $table->string('cover_image_url')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('area_id');
            $table->index('estate_type');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estates');
    }
};
