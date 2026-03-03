<?php

namespace App\Providers;

use App\Models\Area;
use App\Models\City;
use App\Models\Commission;
use App\Models\Document;
use App\Models\Estate;
use App\Models\Lead;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\State;
use App\Policies\CommissionPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\EstatePolicy;
use App\Policies\LeadPolicy;
use App\Policies\PropertyPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register authorization policies
        Gate::policy(Property::class, PropertyPolicy::class);
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(Commission::class, CommissionPolicy::class);
        Gate::policy(Estate::class, EstatePolicy::class);

        // Pagination: clamp per_page between 1 and max (default 100)
        Request::macro('perPage', function (int $default = 20, int $max = 100): int {
            return min(max($this->integer('per_page', $default), 1), $max);
        });

        // Validate critical env keys in production
        if ($this->app->isProduction()) {
            foreach (['APP_KEY', 'DB_PASSWORD', 'REDIS_PASSWORD'] as $key) {
                if (empty(env($key))) {
                    Log::critical("Missing required environment variable: {$key}");
                }
            }

            foreach (['TERMII_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'PAYSTACK_SECRET_KEY'] as $key) {
                if (empty(env($key))) {
                    Log::warning("Optional service not configured: {$key}");
                }
            }
        }

        // Invalidate location caches when reference data changes
        $flushSearchSuggestions = function () {
            try {
                $prefix = config('database.redis.options.prefix', '');
                $keys = Redis::keys("{$prefix}search_suggestions:*");
                if (!empty($keys)) {
                    Redis::del(array_map(fn ($k) => str_replace($prefix, '', $k), $keys));
                }
            } catch (\Throwable) {
                // Silently fail — suggestions will expire naturally
            }
        };

        State::saved(fn () => Cache::forget('locations:states'));
        State::deleted(fn () => Cache::forget('locations:states'));
        PropertyType::saved(fn () => Cache::forget('locations:property_types'));
        PropertyType::deleted(fn () => Cache::forget('locations:property_types'));

        Area::saved($flushSearchSuggestions);
        Area::deleted($flushSearchSuggestions);
        City::saved($flushSearchSuggestions);
        City::deleted($flushSearchSuggestions);
    }
}
