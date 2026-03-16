<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mortgage_inquiries')) {
            return;
        }

        Schema::create('mortgage_inquiries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('property_id')->nullable();
            $table->bigInteger('annual_income_kobo')->nullable();
            $table->string('employment_type')->nullable();
            $table->bigInteger('desired_amount_kobo')->nullable();
            $table->string('status')->nullable();
            $table->string('partner_bank')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('property_id')->references('id')->on('properties')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mortgage_inquiries');
    }
};
