<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Agent\SubmitVerificationRequest;
use App\Http\Requests\Agent\UpdateProfileRequest;
use App\Http\Resources\AgentDetailResource;
use App\Http\Resources\AgentListResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\PropertyListResource;
use App\Http\Resources\ReviewResource;
use App\Models\AgentProfile;
use App\Models\Lead;
use App\Http\Requests\Review\CreateReviewRequest;
use App\Services\AgentService;
use App\Services\LeadService;
use App\Services\ReviewService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Agents
 *
 * Agent profiles, verification, dashboard, and leads.
 */
class AgentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AgentService $agentService,
        protected LeadService $leadService,
        protected ReviewService $reviewService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $agents = AgentProfile::query()
            ->verified()
            ->with('user')
            ->orderByDesc('avg_rating')
            ->paginate($request->integer('per_page', 20));

        return $this->paginatedResponse(
            $agents->setCollection(
                $agents->getCollection()->map(fn ($a) => new AgentListResource($a))
            )
        );
    }

    public function show(AgentProfile $agent): JsonResponse
    {
        $agent->load(['user', 'officeArea', 'properties' => fn ($q) => $q->approved()->latest()->limit(6)->with(['propertyType', 'city', 'images'])]);

        return $this->successResponse(new AgentDetailResource($agent));
    }

    public function listings(AgentProfile $agent, Request $request): JsonResponse
    {
        $properties = $agent->properties()
            ->approved()
            ->with(['propertyType', 'city', 'images', 'agent.user'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->paginatedResponse(
            $properties->setCollection(
                $properties->getCollection()->map(fn ($p) => new PropertyListResource($p))
            )
        );
    }

    public function reviews(AgentProfile $agent, Request $request): JsonResponse
    {
        $reviews = $agent->reviews()
            ->approved()
            ->with('user')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->paginatedResponse(
            $reviews->setCollection(
                $reviews->getCollection()->map(fn ($r) => new ReviewResource($r))
            )
        );
    }

    /** @authenticated */
    public function createReview(CreateReviewRequest $request, AgentProfile $agent): JsonResponse
    {
        $data = $request->validated();
        $data['agent_profile_id'] = $agent->id;

        $review = $this->reviewService->create($request->user(), $data);

        return $this->successResponse(
            new ReviewResource($review),
            'Review submitted and pending approval.',
            201
        );
    }

    /** @authenticated */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $agent = $this->agentService->updateProfile($agent, $request->validated());

        return $this->successResponse(new AgentDetailResource($agent->load('user')), 'Profile updated.');
    }

    /** @authenticated */
    public function submitVerification(SubmitVerificationRequest $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $agent = $this->agentService->submitVerification(
            $agent,
            $request->validated(),
            $request->allFiles(),
        );

        return $this->successResponse(new AgentDetailResource($agent->load('user')), 'Verification submitted.');
    }

    /** @authenticated */
    public function verificationDocuments(Request $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $urls = $this->agentService->getVerificationDocumentUrls($agent);

        return $this->successResponse([
            'documents'           => $urls,
            'id_document_type'    => $agent->id_document_type,
            'id_document_number'  => $agent->id_document_number,
            'verification_status' => $agent->verification_status,
        ]);
    }

    /** @authenticated */
    public function dashboard(Request $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $stats = $this->agentService->getDashboardStats($agent);

        return $this->successResponse($stats);
    }

    /** @authenticated */
    public function leads(Request $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $leads = $agent->leads()
            ->with(['property.images', 'user'])
            ->latest('created_at')
            ->paginate($request->integer('per_page', 20));

        return $this->paginatedResponse(
            $leads->setCollection(
                $leads->getCollection()->map(fn ($l) => new LeadResource($l))
            )
        );
    }

    /** @authenticated */
    public function respondToLead(Request $request, Lead $lead): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent || $lead->agent_id !== $agent->id) {
            return $this->errorResponse('Unauthorized.', 403);
        }

        $this->leadService->markResponded($lead);
        $this->agentService->recalculateResponseMetrics($agent);

        return $this->successResponse(
            new LeadResource($lead->fresh()->load(['property.images', 'user'])),
            'Lead marked as responded.'
        );
    }
}
