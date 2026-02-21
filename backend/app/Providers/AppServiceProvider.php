<?php

namespace App\Providers;

use App\Models\PropertyType;
use App\Models\State;
use Illuminate\Support\Facades\Cache;
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
        // Invalidate location caches when reference data changes
        State::saved(fn () => Cache::forget('locations:states'));
        State::deleted(fn () => Cache::forget('locations:states'));
        PropertyType::saved(fn () => Cache::forget('locations:property_types'));
        PropertyType::deleted(fn () => Cache::forget('locations:property_types'));
    }
}
