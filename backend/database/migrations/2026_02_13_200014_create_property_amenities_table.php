<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_amenities')) {
            return;
        }

        Schema::create('property_amenities', function (Blueprint $table) {
            $table->uuid('property_id');
            $table->uuid('amenity_id');

            $table->primary(['property_id', 'amenity_id']);
            $table->foreign('property_id')->references('id')->on('properties')->cascadeOnDelete();
            $table->foreign('amenity_id')->references('id')->on('amenities')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_amenities');
    }
};
