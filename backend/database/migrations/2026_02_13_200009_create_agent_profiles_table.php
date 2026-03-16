<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('agent_profiles')) {
            return;
        }

        Schema::create('agent_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('company_name')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('license_number')->nullable();
            $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])->default('unverified');
            $table->timestampTz('verified_at')->nullable();
            $table->uuid('verified_by')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->enum('id_document_type', ['NIN', 'drivers_license', 'voters_card'])->nullable();
            $table->string('id_document_url')->nullable();
            $table->string('cac_document_url')->nullable();
            $table->string('whatsapp_number')->nullable();
            $table->string('office_address')->nullable();
            $table->uuid('office_area_id')->nullable();
            $table->enum('subscription_tier', ['free', 'basic', 'pro', 'enterprise'])->default('free');
            $table->timestampTz('subscription_expires_at')->nullable();
            $table->integer('max_listings')->default(3);
            $table->integer('active_listings')->default(0);
            $table->integer('total_listings')->default(0);
            $table->integer('total_leads')->default(0);
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->decimal('response_rate', 5, 2)->default(0);
            $table->integer('avg_response_time')->nullable();
            $table->text('bio')->nullable();
            $table->json('specializations')->nullable();
            $table->integer('years_experience')->nullable();
            $table->timestampsTz();

            $table->foreign('verified_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('office_area_id')->references('id')->on('areas')->nullOnDelete();

            $table->index('verification_status');
            $table->index('subscription_tier');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_profiles');
    }
};
