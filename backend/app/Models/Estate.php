<?php

namespace App\Models;

use App\Enums\EstateType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations;
use Illuminate\Database\Eloquent\SoftDeletes;

class Estate extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'area_id', 'name', 'slug', 'description', 'estate_type',
        'developer', 'year_built', 'total_units', 'amenities',
        'security_type', 'service_charge_kobo', 'service_charge_period',
        'electricity_source', 'water_source', 'cover_image_url',
    ];

    protected function casts(): array
    {
        return [
            'estate_type'         => EstateType::class,
            'amenities'           => 'array',
            'service_charge_kobo' => 'integer',
            'total_units'         => 'integer',
            'year_built'          => 'integer',
        ];
    }

    // ── Relationships ─────────────────────────────────────

    public function area(): Relations\BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function properties(): Relations\HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function reviews(): Relations\HasMany
    {
        return $this->hasMany(EstateReview::class);
    }

    // ── Scopes ────────────────────────────────────────────

    public function scopeByArea(Builder $query, string $areaId): Builder
    {
        return $query->where('area_id', $areaId);
    }

    public function scopeByType(Builder $query, EstateType $type): Builder
    {
        return $query->where('estate_type', $type);
    }

    public function scopeWithAvgRating(Builder $query): Builder
    {
        return $query->withAvg('reviews', 'rating');
    }

    // ── Accessors ─────────────────────────────────────────

    public function getAvgRatingAttribute(): ?float
    {
        return $this->reviews_avg_rating
            ? round((float) $this->reviews_avg_rating, 1)
            : null;
    }
}
