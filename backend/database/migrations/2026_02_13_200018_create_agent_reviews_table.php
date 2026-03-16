<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('agent_reviews')) {
            return;
        }

        Schema::create('agent_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('agent_id')->constrained('agent_profiles')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('overall_rating', 2, 1);
            $table->decimal('responsiveness', 2, 1)->nullable();
            $table->decimal('honesty', 2, 1)->nullable();
            $table->decimal('professionalism', 2, 1)->nullable();
            $table->string('title')->nullable();
            $table->text('comment')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'flagged'])->default('pending');
            $table->boolean('verified_interaction')->default(false);
            $table->uuid('lead_id')->nullable();
            $table->timestampsTz();

            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();

            $table->unique(['agent_id', 'user_id']);
            $table->index(['agent_id', 'status']);
        });

        // CHECK constraints for ratings (1-5)
        DB::statement('ALTER TABLE agent_reviews ADD CONSTRAINT agent_reviews_overall_check CHECK (overall_rating >= 1 AND overall_rating <= 5)');
        DB::statement('ALTER TABLE agent_reviews ADD CONSTRAINT agent_reviews_responsiveness_check CHECK (responsiveness IS NULL OR (responsiveness >= 1 AND responsiveness <= 5))');
        DB::statement('ALTER TABLE agent_reviews ADD CONSTRAINT agent_reviews_honesty_check CHECK (honesty IS NULL OR (honesty >= 1 AND honesty <= 5))');
        DB::statement('ALTER TABLE agent_reviews ADD CONSTRAINT agent_reviews_professionalism_check CHECK (professionalism IS NULL OR (professionalism >= 1 AND professionalism <= 5))');
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_reviews');
    }
};
