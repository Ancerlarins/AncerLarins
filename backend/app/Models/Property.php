<?php

namespace App\Models;

use App\Enums\Furnishing;
use App\Enums\ListingType;
use App\Enums\PropertyStatus;
use App\Enums\RentPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Property extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'agent_id', 'listing_type', 'property_type_id',
        'title', 'slug', 'description',
        'price_kobo', 'price_negotiable', 'rent_period', 'agency_fee_pct',
        'caution_fee_kobo', 'service_charge_kobo', 'legal_fee_kobo',
        'min_stay_days', 'max_stay_days', 'check_in_time', 'check_out_time',
        'state_id', 'city_id', 'area_id', 'estate_id', 'address', 'landmark_note', 'location_fuzzy',
        'bedrooms', 'bathrooms', 'toilets', 'sitting_rooms',
        'floor_area_sqm', 'land_area_sqm', 'floor_number', 'total_floors', 'year_built',
        'furnishing', 'parking_spaces',
        'has_bq', 'has_swimming_pool', 'has_gym', 'has_cctv',
        'has_generator', 'has_water_supply', 'has_prepaid_meter',
        'is_serviced', 'is_new_build',
        'available_from', 'inspection_available',
        'status', 'rejection_reason', 'approved_by', 'approved_at',
        'featured', 'featured_until',
        'meta_title', 'meta_description',
        'published_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'listing_type' => ListingType::class,
            'status' => PropertyStatus::class,
            'furnishing' => Furnishing::class,
            'rent_period' => RentPeriod::class,
            'price_kobo' => 'integer',
            'caution_fee_kobo' => 'integer',
            'service_charge_kobo' => 'integer',
            'legal_fee_kobo' => 'integer',
            'price_negotiable' => 'boolean',
            'location_fuzzy' => 'boolean',
            'has_bq' => 'boolean',
            'has_swimming_pool' => 'boolean',
            'has_gym' => 'boolean',
            'has_cctv' => 'boolean',
            'has_generator' => 'boolean',
            'has_water_supply' => 'boolean',
            'has_prepaid_meter' => 'boolean',
            'is_serviced' => 'boolean',
            'is_new_build' => 'boolean',
            'inspection_available' => 'boolean',
            'featured' => 'boolean',
            'available_from' => 'date',
            'approved_at' => 'datetime',
            'featured_until' => 'datetime',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
            'estimated_value_kobo' => 'integer',
            'last_valued_at' => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────────

    public function agent(): Relations\BelongsTo
    {
        return $this->belongsTo(AgentProfile::class, 'agent_id');
    }

    public function propertyType(): Relations\BelongsTo
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function state(): Relations\BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function city(): Relations\BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function area(): Relations\BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function estate(): Relations\BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function approvedByUser(): Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function images(): Relations\HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('sort_order');
    }

    public function views(): Relations\HasMany
    {
        return $this->hasMany(PropertyView::class);
    }

    public function leads(): Relations\HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function priceHistory(): Relations\HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }

    public function amenities(): Relations\BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'property_amenities');
    }

    public function savedBy(): Relations\HasMany
    {
        return $this->hasMany(SavedProperty::class);
    }

    public function reports(): Relations\MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    public function virtualTour(): Relations\HasOne
    {
        return $this->hasOne(VirtualTour::class);
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', PropertyStatus::Approved);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', PropertyStatus::Pending);
    }

    public function scopeForRent(Builder $query): Builder
    {
        return $query->where('listing_type', ListingType::Rent);
    }

    public function scopeForSale(Builder $query): Builder
    {
        return $query->where('listing_type', ListingType::Sale);
    }

    public function scopeForShortLet(Builder $query): Builder
    {
        return $query->where('listing_type', ListingType::ShortLet);
    }

    public function scopeInCity(Builder $query, string $cityId): Builder
    {
        return $query->where('city_id', $cityId);
    }

    public function scopeInArea(Builder $query, string $areaId): Builder
    {
        return $query->where('area_id', $areaId);
    }

    public function scopePriceBetween(Builder $query, ?int $minKobo, ?int $maxKobo): Builder
    {
        if ($minKobo !== null) $query->where('price_kobo', '>=', $minKobo);
        if ($maxKobo !== null) $query->where('price_kobo', '<=', $maxKobo);
        return $query;
    }

    public function scopeWithBedrooms(Builder $query, ?int $min, ?int $max): Builder
    {
        if ($min !== null) $query->where('bedrooms', '>=', $min);
        if ($max !== null) $query->where('bedrooms', '<=', $max);
        return $query;
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('featured', true)->where(function ($q) {
            $q->whereNull('featured_until')->orWhere('featured_until', '>', now());
        });
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->whereRaw(
            "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ?)",
            [$term]
        );
    }

    public function scopeNearby(Builder $query, float $lat, float $lng, int $radiusKm = 5): Builder
    {
        return $query->whereNotNull('location')
            ->whereRaw(
                'ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
                [$lng, $lat, $radiusKm * 1000]
            );
    }

    // ── Accessors ────────────────────────────────────────

    public function getFormattedPriceAttribute(): string
    {
        return '₦' . number_format($this->price_kobo / 100, 0, '.', ',');
    }

    public function getIsNewAttribute(): bool
    {
        return $this->published_at && $this->published_at->gt(now()->subDays(7));
    }

    public function getCoverImageAttribute(): ?PropertyImage
    {
        return $this->images->firstWhere('is_cover', true) ?? $this->images->first();
    }

    // ── Location helpers ─────────────────────────────────

    public function setLocation(float $lat, float $lng): void
    {
        DB::statement(
            'UPDATE properties SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?',
            [$lng, $lat, $this->id]
        );
    }
}
