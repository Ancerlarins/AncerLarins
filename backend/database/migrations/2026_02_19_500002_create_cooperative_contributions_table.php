<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cooperative_contributions')) {
            return;
        }

        Schema::create('cooperative_contributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('cooperative_members')->cascadeOnDelete();
            $table->bigInteger('amount_kobo');
            $table->string('payment_reference')->nullable()->unique();
            $table->string('payment_method')->nullable();
            $table->string('status')->default('pending'); // pending, verified, failed
            $table->timestampTz('contributed_at')->nullable();
            $table->timestampTz('verified_at')->nullable();
            $table->timestampsTz();

            $table->index(['cooperative_id', 'member_id']);
            $table->index('payment_reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooperative_contributions');
    }
};
