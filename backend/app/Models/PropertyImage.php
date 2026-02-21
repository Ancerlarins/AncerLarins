<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations;

class PropertyImage extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'property_id', 'image_url', 'thumbnail_url', 'watermarked_url',
        'cloudinary_public_id',
        'caption', 'sort_order', 'is_cover', 'width', 'height', 'file_size_bytes',
    ];

    protected function casts(): array
    {
        return [
            'is_cover' => 'boolean',
            'sort_order' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'file_size_bytes' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────────

    public function property(): Relations\BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    // ── Accessors ──────────────────────────────────────────

    public function getUrlAttribute(): ?string
    {
        return $this->image_url;
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopeCovers(Builder $query): Builder
    {
        return $query->where('is_cover', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }
}
