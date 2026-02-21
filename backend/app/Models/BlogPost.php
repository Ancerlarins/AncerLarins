<?php

namespace App\Models;

use App\Enums\BlogPostCategory;
use App\Enums\BlogPostStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations;
use Illuminate\Database\Eloquent\SoftDeletes;

class BlogPost extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'author_id', 'title', 'slug', 'excerpt', 'content',
        'cover_image_url', 'category', 'tags', 'status',
        'meta_title', 'meta_description', 'view_count', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'category'     => BlogPostCategory::class,
            'status'       => BlogPostStatus::class,
            'tags'         => 'array',
            'published_at' => 'datetime',
            'view_count'   => 'integer',
        ];
    }

    // ── Relationships ────────────────────────────────────

    public function author(): Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', BlogPostStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeByCategory(Builder $query, BlogPostCategory $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $sanitized = str_replace(['\\', "'", '"'], '', $term);

        return $query->whereRaw(
            "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('english', ?)",
            [$sanitized]
        );
    }
}
