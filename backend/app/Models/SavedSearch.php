<?php

namespace App\Models;

use App\Enums\NotificationFrequency;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations;

class SavedSearch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'name', 'listing_type', 'property_type_id',
        'city_id', 'area_ids', 'min_price_kobo', 'max_price_kobo',
        'min_bedrooms', 'max_bedrooms', 'furnishing',
        'additional_filters', 'notify_push', 'notify_whatsapp', 'notify_email',
        'frequency', 'last_notified_at', 'match_count', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'area_ids'           => 'array',
            'additional_filters' => 'array',
            'min_price_kobo'     => 'integer',
            'max_price_kobo'     => 'integer',
            'min_bedrooms'       => 'integer',
            'max_bedrooms'       => 'integer',
            'notify_push'        => 'boolean',
            'notify_whatsapp'    => 'boolean',
            'notify_email'       => 'boolean',
            'frequency'          => NotificationFrequency::class,
            'last_notified_at'   => 'datetime',
            'match_count'        => 'integer',
            'is_active'          => 'boolean',
        ];
    }

    // ── Relationships ────────────────────────────────────

    public function user(): Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function propertyType(): Relations\BelongsTo
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function city(): Relations\BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeNeedsNotification(Builder $query): Builder
    {
        return $query->active()
            ->where(function (Builder $q) {
                $q->where('notify_push', true)
                    ->orWhere('notify_whatsapp', true)
                    ->orWhere('notify_email', true);
            });
    }
}
