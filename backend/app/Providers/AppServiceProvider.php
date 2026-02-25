<?php

namespace App\Providers;

use App\Models\Commission;
use App\Models\Document;
use App\Models\Lead;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\State;
use App\Policies\CommissionPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\LeadPolicy;
use App\Policies\PropertyPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
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

        // Pagination: clamp per_page between 1 and max (default 100)
        Request::macro('perPage', function (int $default = 20, int $max = 100): int {
            return min(max($this->integer('per_page', $default), 1), $max);
        });

        // Invalidate location caches when reference data changes
        State::saved(fn () => Cache::forget('locations:states'));
        State::deleted(fn () => Cache::forget('locations:states'));
        PropertyType::saved(fn () => Cache::forget('locations:property_types'));
        PropertyType::deleted(fn () => Cache::forget('locations:property_types'));
    }
}
