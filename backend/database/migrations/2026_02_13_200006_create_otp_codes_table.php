<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('otp_codes')) {
            return;
        }

        Schema::create('otp_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone');
            $table->string('code', 6);
            $table->enum('purpose', ['registration', 'login', 'password_reset', 'phone_change']);
            $table->timestampTz('expires_at');
            $table->timestampTz('verified_at')->nullable();
            $table->integer('attempts')->default(0);
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['phone', 'purpose', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
