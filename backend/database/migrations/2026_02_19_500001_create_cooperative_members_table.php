<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cooperative_members')) {
            return;
        }

        Schema::create('cooperative_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member'); // admin, treasurer, member
            $table->bigInteger('total_contributed_kobo')->default(0);
            $table->timestampTz('joined_at');
            $table->string('status')->default('active'); // active, paused, withdrawn
            $table->timestampsTz();

            $table->unique(['cooperative_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooperative_members');
    }
};
