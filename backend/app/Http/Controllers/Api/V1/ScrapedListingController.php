<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ScrapedListingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ScrapedListingResource;
use App\Models\ScrapedListing;
use App\Services\ScrapedListingImportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin - Scraped Listings
 * @authenticated
 *
 * Review and approve/reject scraped property listings from external sources.
 */
class ScrapedListingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ScrapedListingImportService $importService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $listings = ScrapedListing::query()
            ->when($request->source, fn ($q, $v) => $q->where('source', $v))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->listing_type, fn ($q, $v) => $q->where('listing_type', $v))
            ->latest('created_at')
            ->paginate($request->perPage(20));

        return $this->paginatedResponse(
            $listings->setCollection(
                $listings->getCollection()->map(fn ($l) => new ScrapedListingResource($l))
            )
        );
    }

    public function approve(Request $request, ScrapedListing $scrapedListing): JsonResponse
    {
        if ($scrapedListing->status !== ScrapedListingStatus::Pending) {
            return $this->errorResponse('Only pending listings can be approved.', 422);
        }

        try {
            $property = $this->importService->import(
                $scrapedListing,
                $request->user()?->id,
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to import listing: ' . $e->getMessage(), 500);
        }

        $scrapedListing->refresh();

        return $this->successResponse(
            new ScrapedListingResource($scrapedListing),
            'Scraped listing approved and imported as property #' . $property->id . '.'
        );
    }

    public function reject(Request $request, ScrapedListing $scrapedListing): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $scrapedListing->update([
            'status'           => ScrapedListingStatus::Rejected,
            'rejection_reason' => $request->reason,
        ]);

        return $this->successResponse(null, 'Scraped listing rejected.');
    }
}
