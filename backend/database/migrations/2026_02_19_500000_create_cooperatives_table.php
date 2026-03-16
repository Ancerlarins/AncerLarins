<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cooperatives')) {
            return;
        }

        Schema::create('cooperatives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignUuid('admin_user_id')->constrained('users')->cascadeOnDelete();
            $table->bigInteger('target_amount_kobo');
            $table->foreignUuid('property_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('estate_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('area_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('forming'); // forming, active, target_reached, completed, dissolved
            $table->unsignedInteger('member_count')->default(0);
            $table->bigInteger('monthly_contribution_kobo')->nullable();
            $table->date('start_date')->nullable();
            $table->date('target_date')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('status');
            $table->index('admin_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooperatives');
    }
};
