<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('neighborhood_reviews')) {
            return;
        }

        Schema::create('neighborhood_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('area_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('overall', 2, 1);
            $table->decimal('safety', 2, 1)->nullable();
            $table->decimal('transport', 2, 1)->nullable();
            $table->decimal('amenities', 2, 1)->nullable();
            $table->decimal('noise', 2, 1)->nullable();
            $table->text('comment')->nullable();
            $table->string('lived_duration')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['area_id', 'user_id']);
        });

        DB::statement('ALTER TABLE neighborhood_reviews ADD CONSTRAINT neighborhood_reviews_overall_check CHECK (overall >= 1 AND overall <= 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('neighborhood_reviews');
    }
};
