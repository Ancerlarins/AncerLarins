<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ListingType;
use App\Enums\PropertyRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyRequest\CreatePropertyRequestRequest;
use App\Http\Requests\PropertyRequest\RespondToRequestRequest;
use App\Http\Resources\PropertyRequestListResource;
use App\Http\Resources\PropertyRequestResource;
use App\Models\PropertyRequest;
use App\Models\PropertyRequestResponse;
use App\Services\PropertyRequestService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Property Requests
 *
 * Reverse listings — buyers post what they need, agents respond.
 */
class PropertyRequestController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PropertyRequestService $propertyRequestService,
    ) {}

    /**
     * Public: browse active requests (for agents).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PropertyRequest::active()
            ->with(['area', 'city', 'propertyType'])
            ->latest();

        if ($request->filled('listing_type')) {
            $type = ListingType::tryFrom($request->input('listing_type'));
            if ($type) {
                $query->byListingType($type);
            }
        }

        if ($request->filled('area_id')) {
            $query->byArea($request->input('area_id'));
        }

        if ($request->filled('city_id')) {
            $query->where('city_id', $request->input('city_id'));
        }

        $requests = $query->paginate($request->perPage(15));

        return $this->paginatedResponse(
            $requests->through(fn ($r) => new PropertyRequestListResource($r)),
            'Property requests retrieved.'
        );
    }

    /**
     * Auth: user's own requests.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $requests = PropertyRequest::where('user_id', $request->user()->id)
            ->with(['area', 'city', 'propertyType'])
            ->latest()
            ->paginate($request->perPage(15));

        return $this->paginatedResponse(
            $requests->through(fn ($r) => new PropertyRequestListResource($r)),
            'Your property requests retrieved.'
        );
    }

    /**
     * Auth: create a new property request.
     */
    public function store(CreatePropertyRequestRequest $request): JsonResponse
    {
        $propertyRequest = $this->propertyRequestService->create(
            $request->validated(),
            $request->user()
        );

        $propertyRequest->load(['area', 'city', 'propertyType']);

        return $this->successResponse(
            new PropertyRequestResource($propertyRequest),
            'Property request created.',
            201
        );
    }

    /**
     * Public: view a single request with responses.
     */
    public function show(PropertyRequest $propertyRequest): JsonResponse
    {
        $propertyRequest->load([
            'user', 'area', 'city', 'propertyType',
            'responses.agent', 'responses.property',
        ]);

        return $this->successResponse(new PropertyRequestResource($propertyRequest));
    }

    /**
     * Agent: respond to a property request.
     */
    public function respond(RespondToRequestRequest $request, PropertyRequest $propertyRequest): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 403);
        }

        if ($propertyRequest->status !== PropertyRequestStatus::Active) {
            return $this->errorResponse('This request is no longer active.', 422);
        }

        // Check if agent already responded
        $existing = $propertyRequest->responses()
            ->where('agent_id', $agent->id)
            ->exists();

        if ($existing) {
            return $this->errorResponse('You have already responded to this request.', 422);
        }

        $response = $this->propertyRequestService->respond(
            $propertyRequest,
            $agent,
            $request->validated()
        );

        $response->load(['agent', 'property']);

        return $this->successResponse($response, 'Response submitted.', 201);
    }

    /**
     * Owner: accept a response.
     */
    public function acceptResponse(Request $request, PropertyRequest $propertyRequest, PropertyRequestResponse $response): JsonResponse
    {
        if ($propertyRequest->user_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized.', 403);
        }

        if ($response->property_request_id !== $propertyRequest->id) {
            return $this->errorResponse('Response does not belong to this request.', 422);
        }

        $this->propertyRequestService->acceptResponse($propertyRequest, $response);

        return $this->successResponse(null, 'Response accepted.');
    }

    /**
     * Owner: delete (cancel) a request.
     */
    public function destroy(Request $request, PropertyRequest $propertyRequest): JsonResponse
    {
        if ($propertyRequest->user_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized.', 403);
        }

        $propertyRequest->update(['status' => PropertyRequestStatus::Cancelled]);
        $propertyRequest->delete();

        return $this->successResponse(null, 'Property request cancelled.', 204);
    }

    // ── Admin ─────────────────────────────────────────────

    /**
     * Admin: list all property requests (all statuses).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = PropertyRequest::with(['user', 'area', 'city', 'propertyType'])
            ->withCount('responses')
            ->latest();

        if ($request->filled('status')) {
            $status = PropertyRequestStatus::tryFrom($request->input('status'));
            if ($status) {
                $query->where('status', $status);
            }
        }

        if ($request->filled('listing_type')) {
            $type = ListingType::tryFrom($request->input('listing_type'));
            if ($type) {
                $query->byListingType($type);
            }
        }

        if ($request->filled('area_id')) {
            $query->byArea($request->input('area_id'));
        }

        if ($request->filled('q')) {
            $q = str_replace(['%', '_'], ['\\%', '\\_'], $request->input('q'));
            $query->where('title', 'like', '%'.$q.'%');
        }

        $requests = $query->paginate($request->perPage(20));

        return $this->paginatedResponse(
            $requests->through(fn ($r) => new PropertyRequestListResource($r)),
            'Property requests retrieved.'
        );
    }

    /**
     * Admin: view property request detail.
     */
    public function adminShow(PropertyRequest $propertyRequest): JsonResponse
    {
        $propertyRequest->load([
            'responses.agent', 'responses.property', 'user',
            'area', 'city', 'propertyType',
        ]);

        return $this->successResponse(new PropertyRequestResource($propertyRequest));
    }

    /**
     * Admin: update property request status.
     */
    public function adminUpdateStatus(Request $request, PropertyRequest $propertyRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,fulfilled,expired,cancelled'],
        ]);

        $propertyRequest->update(['status' => PropertyRequestStatus::from($validated['status'])]);

        return $this->successResponse(
            new PropertyRequestResource($propertyRequest),
            'Property request status updated.'
        );
    }

    /**
     * Admin: soft delete property request.
     */
    public function adminDestroy(PropertyRequest $propertyRequest): JsonResponse
    {
        $propertyRequest->delete();

        return $this->successResponse(null, 'Property request deleted.', 204);
    }
}
