<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Neighborhood\CreateNeighborhoodReviewRequest;
use App\Http\Resources\AreaResource;
use App\Models\Area;
use App\Models\City;
use App\Models\PropertyType;
use App\Models\State;
use App\Services\MarketTrendService;
use App\Services\NeighborhoodService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * @group Locations
 *
 * States, cities, areas, property types, and neighborhood insights.
 */
class LocationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected NeighborhoodService $neighborhoodService,
        protected MarketTrendService $marketTrendService,
    ) {}

    public function states(): JsonResponse
    {
        $states = Cache::remember('locations:states', 3600, function () {
            return State::active()->orderBy('name')->get(['id', 'name', 'slug']);
        });

        return $this->successResponse($states);
    }

    public function cities(Request $request): JsonResponse
    {
        $query = City::active()->orderBy('name');

        if ($request->filled('state_id')) {
            $query->where('state_id', $request->state_id);
        }

        return $this->successResponse($query->get(['id', 'state_id', 'name', 'slug']));
    }

    public function areas(Request $request): JsonResponse
    {
        $query = Area::active()->with('city')->orderBy('name');

        if ($request->filled('city_id')) {
            $query->where('city_id', $request->city_id);
        }

        return $this->successResponse(AreaResource::collection($query->get()));
    }

    public function citiesByState(State $state): JsonResponse
    {
        $cities = Cache::remember("locations:cities:{$state->id}", 3600, function () use ($state) {
            return City::active()->where('state_id', $state->id)->orderBy('name')->get(['id', 'state_id', 'name', 'slug']);
        });

        return $this->successResponse($cities);
    }

    public function areasByCity(City $city): JsonResponse
    {
        $areas = Area::active()->with('city')->where('city_id', $city->id)->orderBy('name')->get();

        return $this->successResponse(AreaResource::collection($areas));
    }

    public function propertyTypes(): JsonResponse
    {
        $types = Cache::remember('locations:property_types', 3600, function () {
            return PropertyType::orderBy('name')->get(['id', 'name', 'slug']);
        });

        return $this->successResponse($types);
    }

    public function areaDetail(Area $area): JsonResponse
    {
        $area->load(['city.state', 'landmarks', 'properties' => fn ($q) => $q->approved()->count()]);

        return $this->successResponse(new AreaResource($area));
    }

    public function areaInsights(Area $area): JsonResponse
    {
        $insights = Cache::remember("area_insights:{$area->id}", 900, function () use ($area) {
            return $this->neighborhoodService->getAreaInsights($area);
        });

        return $this->successResponse($insights);
    }

    /** @authenticated */
    public function submitAreaReview(CreateNeighborhoodReviewRequest $request, Area $area): JsonResponse
    {
        $review = $this->neighborhoodService->submitReview(
            $request->user(),
            $area,
            $request->validated()
        );

        return $this->successResponse(
            ['id' => $review->id],
            'Review submitted and pending approval.',
            201
        );
    }

    public function areaTrends(Area $area, Request $request): JsonResponse
    {
        $listingType = $request->query('listing_type');
        $cacheKey = "area_trends:{$area->id}:" . ($listingType ?: 'all');

        $data = Cache::remember($cacheKey, 1800, function () use ($area, $listingType) {
            return [
                'trends' => $this->marketTrendService->getAreaTrends($area->id, $listingType),
                'stats'  => $this->marketTrendService->getAreaStats($area->id, $listingType),
            ];
        });

        return $this->successResponse($data);
    }
}
