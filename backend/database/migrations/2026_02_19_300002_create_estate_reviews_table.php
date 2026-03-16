<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('estate_reviews')) {
            return;
        }

        Schema::create('estate_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('estate_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->text('pros')->nullable();
            $table->text('cons')->nullable();
            $table->date('lived_from')->nullable();
            $table->date('lived_to')->nullable();
            $table->timestampsTz();

            $table->unique(['estate_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_reviews');
    }
};
