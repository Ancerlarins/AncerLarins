<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'avatar_url',
        'password_hash', 'phone_verified', 'email_verified', 'role', 'status',
        'ban_reason', 'banned_at', 'banned_by', 'preferred_city_id',
        'last_login_at', 'last_login_ip',
    ];

    protected $hidden = ['password_hash'];

    protected $appends = ['full_name'];

    protected function casts(): array
    {
        return [
            'phone_verified' => 'boolean',
            'email_verified' => 'boolean',
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'banned_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password_hash' => 'hashed',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    // ── Relationships ────────────────────────────────────

    public function preferredCity(): Relations\BelongsTo
    {
        return $this->belongsTo(City::class, 'preferred_city_id');
    }

    public function bannedByUser(): Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'banned_by');
    }

    public function agentProfile(): Relations\HasOne
    {
        return $this->hasOne(AgentProfile::class);
    }

    public function savedProperties(): Relations\HasMany
    {
        return $this->hasMany(SavedProperty::class);
    }

    public function savedSearches(): Relations\HasMany
    {
        return $this->hasMany(SavedSearch::class);
    }

    public function leads(): Relations\HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function agentReviews(): Relations\HasMany
    {
        return $this->hasMany(AgentReview::class);
    }

    public function reports(): Relations\HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function notifications(): Relations\HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function pushTokens(): Relations\HasMany
    {
        return $this->hasMany(PushToken::class);
    }

    public function activityLogs(): Relations\HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function propertyViews(): Relations\HasMany
    {
        return $this->hasMany(PropertyView::class);
    }

    public function searchLogs(): Relations\HasMany
    {
        return $this->hasMany(SearchLog::class);
    }

    public function neighborhoodReviews(): Relations\HasMany
    {
        return $this->hasMany(NeighborhoodReview::class);
    }

    public function mortgageInquiries(): Relations\HasMany
    {
        return $this->hasMany(MortgageInquiry::class);
    }

    public function refreshTokens(): Relations\HasMany
    {
        return $this->hasMany(RefreshToken::class);
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', UserStatus::Active);
    }

    public function scopeAgents($query)
    {
        return $query->where('role', UserRole::Agent);
    }

    public function scopeAdmins($query)
    {
        return $query->whereIn('role', [UserRole::Admin, UserRole::SuperAdmin]);
    }

    public function scopeVerified($query)
    {
        return $query->where('phone_verified', true);
    }

    // ── Helpers ─────────────────────────────────────────

    public function isAdmin(): bool
    {
        return in_array($this->role, [UserRole::Admin, UserRole::SuperAdmin]);
    }

    // ── Accessors ────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
