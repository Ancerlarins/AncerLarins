<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('blog_posts')) {
            return;
        }

        Schema::create('blog_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->text('content');
            $table->string('cover_image_url')->nullable();
            $table->enum('category', ['guide', 'market_report', 'tips', 'news', 'area_spotlight']);
            $table->json('tags')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            $table->unsignedInteger('view_count')->default(0);
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('status');
            $table->index('category');
            $table->index('published_at');
            $table->index('author_id');
        });

        // MySQL fulltext index (replaces PostgreSQL GIN index)
        DB::statement('ALTER TABLE blog_posts ADD FULLTEXT blog_posts_fulltext_idx (title, excerpt, content)');
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
