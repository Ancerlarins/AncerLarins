<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('push_tokens')) {
            return;
        }

        Schema::create('push_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('token');
            $table->string('device_type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // Standard index (MySQL doesn't support partial indexes)
        DB::statement('CREATE INDEX push_tokens_user_active ON push_tokens (user_id, is_active)');
    }

    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
    }
};
