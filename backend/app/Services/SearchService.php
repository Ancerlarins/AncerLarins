<?php

namespace App\Services;

use App\Models\Area;
use App\Models\City;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\SearchLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SearchService
{
    public function __construct(
        protected GeoSearchService $geoSearchService,
    ) {}

    /**
     * @return array{results: LengthAwarePaginator, facets: array}
     */
    public function search(array $filters, ?string $userId = null): array
    {
        $query = $this->buildSearchQuery($filters);

        // Clone query before pagination to compute facets
        $facetBaseQuery = (clone $query)->getQuery();

        $sortBy = $filters['sort_by'] ?? 'newest';
        match ($sortBy) {
            'price_asc' => $query->orderBy('price_kobo', 'asc'),
            'price_desc' => $query->orderBy('price_kobo', 'desc'),
            'popular' => $query->withCount('views')->orderByDesc('views_count'),
            default => $query->latest('published_at'),
        };

        $results = $query->paginate($filters['per_page'] ?? 20);

        $facets = $this->computeFacets($facetBaseQuery);

        $this->logSearch($filters, $userId, $results->total());

        return [
            'results' => $results,
            'facets' => $facets,
        ];
    }

    public function suggestions(string $query): array
    {
        $cacheKey = 'search_suggestions:'.mb_strtolower(trim($query));

        return Cache::remember($cacheKey, 3600, function () use ($query) {
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $query);

            $areas = Area::where('name', 'like', "%{$escaped}%")
                ->active()
                ->with('city')
                ->limit(4)
                ->get()
                ->map(fn ($a) => [
                    'type' => 'area',
                    'id' => $a->id,
                    'label' => $a->name,
                    'slug' => $a->slug,
                    'parent_name' => $a->city?->name,
                ]);

            $cities = City::where('name', 'like', "%{$escaped}%")
                ->active()
                ->with('state')
                ->limit(3)
                ->get()
                ->map(fn ($c) => [
                    'type' => 'city',
                    'id' => $c->id,
                    'label' => $c->name,
                    'slug' => $c->slug,
                    'parent_name' => $c->state?->name,
                ]);

            $propertyTypes = PropertyType::where('name', 'like', "%{$escaped}%")
                ->active()
                ->limit(3)
                ->get()
                ->map(fn ($pt) => [
                    'type' => 'property_type',
                    'id' => $pt->id,
                    'label' => $pt->name,
                    'slug' => $pt->slug,
                    'parent_name' => null,
                ]);

            return array_merge(
                $areas->toArray(),
                $cities->toArray(),
                $propertyTypes->toArray(),
            );
        });
    }

    public function mapSearch(float $north, float $south, float $east, float $west, array $filters = []): array
    {
        $query = $this->geoSearchService->searchByBounds($north, $south, $east, $west);

        $query->approved();

        if (! empty($filters['listing_type'])) {
            $query->where('listing_type', $filters['listing_type']);
        }

        if (! empty($filters['property_type_id'])) {
            $query->where('property_type_id', $filters['property_type_id']);
        }

        if (! empty($filters['min_price']) || ! empty($filters['max_price'])) {
            $query->priceBetween(
                $filters['min_price'] ?? null,
                $filters['max_price'] ?? null,
            );
        }

        return $query->select(['id', 'title', 'slug', 'price_kobo', 'listing_type', 'bedrooms', 'bathrooms'])
            ->addSelect(['latitude', 'longitude'])
            ->limit(200)
            ->get()
            ->toArray();
    }

    protected function buildSearchQuery(array $filters): Builder
    {
        $query = Property::query()->approved()
            ->with(['propertyType', 'city', 'area', 'images', 'agent.user']);

        if (! empty($filters['q'])) {
            $query->search($filters['q']);
        }

        if (! empty($filters['listing_type'])) {
            $query->where('listing_type', $filters['listing_type']);
        }

        if (! empty($filters['property_type_id'])) {
            $query->where('property_type_id', $filters['property_type_id']);
        }

        if (! empty($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }

        if (! empty($filters['city_id'])) {
            $query->inCity($filters['city_id']);
        }

        if (! empty($filters['area_id'])) {
            $query->inArea($filters['area_id']);
        }

        if (! empty($filters['min_price']) || ! empty($filters['max_price'])) {
            $query->priceBetween(
                $filters['min_price'] ?? null,
                $filters['max_price'] ?? null
            );
        }

        if (! empty($filters['min_bedrooms']) || ! empty($filters['max_bedrooms'])) {
            $query->withBedrooms(
                $filters['min_bedrooms'] ?? null,
                $filters['max_bedrooms'] ?? null
            );
        }

        if (! empty($filters['min_bathrooms'])) {
            $query->where('bathrooms', '>=', $filters['min_bathrooms']);
        }

        if (! empty($filters['furnishing'])) {
            $query->where('furnishing', $filters['furnishing']);
        }

        foreach (['is_serviced', 'has_bq', 'has_generator', 'has_water_supply', 'is_new_build'] as $flag) {
            if (isset($filters[$flag])) {
                $query->where($flag, $filters[$flag]);
            }
        }

        return $query;
    }

    protected function computeFacets($baseQuery): array
    {
        $byType = DB::table(DB::raw("({$baseQuery->toSql()}) as filtered"))
            ->mergeBindings($baseQuery)
            ->select('property_type_id', DB::raw('count(*) as count'))
            ->groupBy('property_type_id')
            ->pluck('count', 'property_type_id')
            ->toArray();

        $byArea = DB::table(DB::raw("({$baseQuery->toSql()}) as filtered"))
            ->mergeBindings($baseQuery)
            ->select('area_id', DB::raw('count(*) as count'))
            ->groupBy('area_id')
            ->pluck('count', 'area_id')
            ->toArray();

        return [
            'by_property_type' => $byType,
            'by_area' => $byArea,
        ];
    }

    protected function logSearch(array $filters, ?string $userId, int $resultsCount = 0): void
    {
        SearchLog::create([
            'user_id' => $userId,
            'query_text' => $filters['q'] ?? null,
            'listing_type' => $filters['listing_type'] ?? null,
            'property_type_id' => $filters['property_type_id'] ?? null,
            'city_id' => $filters['city_id'] ?? null,
            'area_id' => $filters['area_id'] ?? null,
            'min_price' => $filters['min_price'] ?? null,
            'max_price' => $filters['max_price'] ?? null,
            'min_bedrooms' => $filters['min_bedrooms'] ?? null,
            'results_count' => $resultsCount,
        ]);
    }
}
