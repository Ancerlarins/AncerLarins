<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_views')) {
            return;
        }

        Schema::create('property_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('property_id')->constrained()->cascadeOnDelete();
            $table->uuid('user_id')->nullable();
            $table->string('session_id')->nullable();
            $table->string('source')->nullable();
            $table->string('device_type')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->boolean('viewed_images')->default(false);
            $table->boolean('contacted_agent')->default(false);
            $table->boolean('saved')->default(false);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->index(['property_id', 'created_at']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_views');
    }
};
