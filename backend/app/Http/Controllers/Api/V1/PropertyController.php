<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\ContactAgentRequest;
use App\Http\Requests\Property\CreatePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Requests\Report\CreateReportRequest;
use App\Http\Resources\PropertyDetailResource;
use App\Http\Resources\PropertyListResource;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Services\LeadService;
use App\Services\PropertyService;
use App\Services\ReportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Properties
 *
 * Browse, create, and manage property listings.
 */
class PropertyController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PropertyService $propertyService,
        protected LeadService $leadService,
        protected ReportService $reportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $properties = Property::query()
            ->approved()
            ->with(['propertyType', 'state', 'city', 'area', 'images', 'agent.user'])
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20));

        return $this->paginatedResponse(
            $properties->setCollection(
                $properties->getCollection()->map(fn ($p) => new PropertyListResource($p))
            )
        );
    }

    public function show(string $slug): JsonResponse
    {
        $property = $this->propertyService->getBySlug($slug);

        if (! $property) {
            return $this->errorResponse('Property not found.', 404);
        }

        $this->propertyService->incrementViewCount($property, [
            'user_id'     => request()->user()?->id,
            'session_id'  => request()->header('X-Session-Id'),
            'source'      => request()->header('Referer'),
            'device_type' => request()->header('X-Device-Type'),
        ]);

        return $this->successResponse(new PropertyDetailResource($property));
    }

    /** @authenticated */
    public function store(CreatePropertyRequest $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile required.', 403);
        }

        $property = $this->propertyService->create($request->validated(), $agent);

        return $this->successResponse(
            new PropertyDetailResource($property),
            'Property created and pending approval.',
            201
        );
    }

    /** @authenticated */
    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        $property = $this->propertyService->update($property, $request->validated());

        return $this->successResponse(
            new PropertyDetailResource($property),
            'Property updated.'
        );
    }

    /** @authenticated */
    public function destroy(Request $request, Property $property): JsonResponse
    {
        if ($request->user()->id !== $property->agent?->user_id) {
            return $this->errorResponse('Unauthorized.', 403);
        }

        $this->propertyService->delete($property);

        return response()->json(null, 204);
    }

    /**
     * Upload Property Images
     *
     * Upload images for a property listing. Maximum 20 images, 5MB each.
     *
     * @authenticated
     * @bodyParam images file[] required Array of image files. Max 5MB each.
     * @bodyParam captions string[] Optional captions for each image.
     *
     * @response 201 {"success": true, "message": "Images uploaded.", "data": []}
     */
    public function uploadImages(Request $request, Property $property): JsonResponse
    {
        $request->validate([
            'images'   => 'required|array|max:20',
            'images.*' => 'image|max:5120',
            'captions' => 'nullable|array',
        ]);

        $images = $this->propertyService->uploadImages(
            $property,
            $request->file('images'),
            $request->input('captions', [])
        );

        return $this->successResponse($images, 'Images uploaded.', 201);
    }

    /** @authenticated */
    public function removeImage(Request $request, PropertyImage $image): JsonResponse
    {
        if ($request->user()->id !== $image->property?->agent?->user_id) {
            return $this->errorResponse('Unauthorized.', 403);
        }

        $this->propertyService->removeImage($image);

        return response()->json(null, 204);
    }

    /** @authenticated */
    public function save(Request $request, Property $property): JsonResponse
    {
        $existing = $request->user()->savedProperties()
            ->where('property_id', $property->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return $this->successResponse(['saved' => false], 'Property unsaved.');
        }

        $request->user()->savedProperties()->create(['property_id' => $property->id]);

        return $this->successResponse(['saved' => true], 'Property saved.', 201);
    }

    /** @authenticated */
    public function contact(ContactAgentRequest $request, Property $property): JsonResponse
    {
        $data = $request->validated();

        $lead = $this->leadService->create(
            $property,
            $request->user(),
            $data['contact_type'],
            $data['source'] ?? null,
            $data['utm_campaign'] ?? null,
        );

        $response = ['lead_id' => $lead->id];

        if ($request->contact_type === 'whatsapp') {
            $response['whatsapp_url'] = $this->leadService->generateWhatsAppLink($property, $lead->id);
        }

        if ($request->contact_type === 'call') {
            $agent = $property->agent;
            $response['phone'] = $agent?->whatsapp_number ?? $agent?->user?->phone ?? '';
        }

        $response['avg_response_time'] = $property->agent?->avg_response_time;

        return $this->successResponse($response, 'Contact logged.');
    }

    /** @authenticated */
    public function report(CreateReportRequest $request): JsonResponse
    {
        $report = $this->reportService->create($request->user(), $request->validated());

        return $this->successResponse($report, 'Report submitted.', 201);
    }

    public function similar(Property $property): JsonResponse
    {
        $similar = Property::query()
            ->approved()
            ->where('id', '!=', $property->id)
            ->where('city_id', $property->city_id)
            ->where('listing_type', $property->listing_type)
            ->priceBetween(
                (int) ($property->price_kobo * 0.7),
                (int) ($property->price_kobo * 1.3)
            )
            ->with(['propertyType', 'city', 'images', 'agent.user'])
            ->limit(6)
            ->get();

        return $this->successResponse(PropertyListResource::collection($similar));
    }
}
