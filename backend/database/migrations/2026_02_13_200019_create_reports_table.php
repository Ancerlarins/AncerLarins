<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reports')) {
            return;
        }

        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('reportable_type');
            $table->uuid('reportable_id');
            $table->enum('reason', [
                'scam', 'fake_listing', 'wrong_price', 'wrong_photos',
                'already_rented', 'harassment', 'spam', 'other',
            ]);
            $table->text('description')->nullable();
            $table->json('evidence_urls')->nullable();
            $table->enum('status', ['open', 'investigating', 'resolved', 'dismissed'])->default('open');
            $table->uuid('resolved_by')->nullable();
            $table->text('resolution_note')->nullable();
            $table->timestampTz('resolved_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();

            $table->index('status');
            $table->index(['reportable_type', 'reportable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
