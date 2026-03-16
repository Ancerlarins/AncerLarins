<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique()->nullable();
            $table->string('phone')->unique();
            $table->string('avatar_url')->nullable();
            $table->string('password_hash')->nullable();
            $table->boolean('phone_verified')->default(false);
            $table->boolean('email_verified')->default(false);
            $table->enum('role', ['user', 'agent', 'admin', 'super_admin'])->default('user');
            $table->enum('status', ['active', 'suspended', 'banned', 'deactivated'])->default('active');
            $table->text('ban_reason')->nullable();
            $table->timestampTz('banned_at')->nullable();
            $table->uuid('banned_by')->nullable();
            $table->uuid('preferred_city_id')->nullable();
            $table->timestampTz('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->foreign('preferred_city_id')->references('id')->on('cities')->nullOnDelete();

            $table->index('role');
            $table->index('status');
        });

        // Self-referencing FK must be added after table creation
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('banned_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
