<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widen PII columns from varchar to text so they can hold
 * Laravel's encrypted cast output (base64-encoded JSON ~250+ chars).
 *
 * Run this BEFORE `php artisan leads:encrypt-pii`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->text('full_name')->nullable()->change();
            $table->text('email')->nullable()->change();
            $table->text('phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('full_name', 100)->nullable()->change();
            $table->string('email', 255)->nullable()->change();
            $table->string('phone', 20)->nullable()->change();
        });
    }
};
