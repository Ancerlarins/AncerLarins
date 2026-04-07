<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CooperativeMemberStatus;
use App\Enums\CooperativeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cooperative\ContributeRequest;
use App\Http\Requests\Cooperative\CreateCooperativeRequest;
use App\Http\Resources\CooperativeListResource;
use App\Http\Resources\CooperativeResource;
use App\Models\Cooperative;
use App\Services\CooperativeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Cooperatives
 *
 * @authenticated
 *
 * Housing cooperatives — create, join, contribute, and track progress.
 */
class CooperativeController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CooperativeService $cooperativeService,
    ) {}

    /**
     * Browse cooperatives.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Cooperative::with('area')
            ->whereIn('status', [CooperativeStatus::Forming, CooperativeStatus::Active])
            ->latest();

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->input('area_id'));
        }

        $cooperatives = $query->paginate($request->perPage(15));

        return $this->paginatedResponse(
            $cooperatives->through(fn ($c) => new CooperativeListResource($c)),
            'Cooperatives retrieved.'
        );
    }

    /**
     * View a cooperative with members.
     */
    public function show(Cooperative $cooperative): JsonResponse
    {
        $cooperative->load(['adminUser', 'area', 'members.user']);

        return $this->successResponse(new CooperativeResource($cooperative));
    }

    /**
     * Create a cooperative.
     */
    public function store(CreateCooperativeRequest $request): JsonResponse
    {
        $cooperative = $this->cooperativeService->create(
            $request->validated(),
            $request->user()
        );

        $cooperative->load(['adminUser', 'area']);

        return $this->successResponse(
            new CooperativeResource($cooperative),
            'Cooperative created.',
            201
        );
    }

    /**
     * Join a cooperative.
     */
    public function join(Request $request, Cooperative $cooperative): JsonResponse
    {
        if (! in_array($cooperative->status, [CooperativeStatus::Forming, CooperativeStatus::Active])) {
            return $this->errorResponse('This cooperative is not accepting members.', 422);
        }

        $existing = $cooperative->members()
            ->where('user_id', $request->user()->id)
            ->where('status', CooperativeMemberStatus::Active)
            ->exists();

        if ($existing) {
            return $this->errorResponse('You are already a member.', 422);
        }

        $member = $this->cooperativeService->join($cooperative, $request->user());

        return $this->successResponse($member, 'Joined cooperative.', 201);
    }

    /**
     * Initialize a contribution (returns Paystack URL).
     */
    public function contribute(ContributeRequest $request, Cooperative $cooperative): JsonResponse
    {
        $member = $cooperative->members()
            ->where('user_id', $request->user()->id)
            ->where('status', CooperativeMemberStatus::Active)
            ->first();

        if (! $member) {
            return $this->errorResponse('You are not a member of this cooperative.', 403);
        }

        $result = $this->cooperativeService->initializeContribution(
            $cooperative,
            $member,
            $request->input('amount_kobo')
        );

        $paystackUrl = $result['paystack']['data']['authorization_url'] ?? null;

        if (! $paystackUrl) {
            return $this->errorResponse('Failed to initialize payment.', 500);
        }

        return $this->successResponse([
            'authorization_url' => $paystackUrl,
            'payment_reference' => $result['contribution']->payment_reference,
        ], 'Payment initialized.');
    }

    /**
     * Verify a contribution.
     */
    public function verifyContribution(Request $request): JsonResponse
    {
        $request->validate(['reference' => ['required', 'string']]);

        $contribution = $this->cooperativeService->verifyContribution($request->input('reference'));

        if (! $contribution) {
            return $this->errorResponse('Contribution not found or already processed.', 404);
        }

        return $this->successResponse([
            'status' => $contribution->status->value,
            'amount_kobo' => $contribution->amount_kobo,
        ], 'Contribution verified.');
    }

    /**
     * User's cooperatives.
     */
    public function myCooperatives(Request $request): JsonResponse
    {
        $cooperatives = Cooperative::whereHas('members', function ($q) use ($request) {
            $q->where('user_id', $request->user()->id)
                ->where('status', CooperativeMemberStatus::Active);
        })
            ->with('area')
            ->latest()
            ->paginate($request->perPage(15));

        return $this->paginatedResponse(
            $cooperatives->through(fn ($c) => new CooperativeListResource($c)),
            'Your cooperatives retrieved.'
        );
    }

    /**
     * Get cooperative progress.
     */
    public function progress(Cooperative $cooperative): JsonResponse
    {
        return $this->successResponse(
            $this->cooperativeService->getProgress($cooperative)
        );
    }

    // ── Admin ─────────────────────────────────────────────

    /**
     * Admin: list all cooperatives (all statuses).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Cooperative::with('area')
            ->withCount('members')
            ->latest();

        if ($request->filled('status')) {
            $status = CooperativeStatus::tryFrom($request->input('status'));
            if ($status) {
                $query->where('status', $status);
            }
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->input('area_id'));
        }

        if ($request->filled('q')) {
            $q = str_replace(['%', '_'], ['\\%', '\\_'], $request->input('q'));
            $query->where('name', 'like', '%'.$q.'%');
        }

        $cooperatives = $query->paginate($request->perPage(20));

        return $this->paginatedResponse(
            $cooperatives->through(fn ($c) => new CooperativeListResource($c)),
            'Cooperatives retrieved.'
        );
    }

    /**
     * Admin: view cooperative detail.
     */
    public function adminShow(Cooperative $cooperative): JsonResponse
    {
        $cooperative->load(['members.user', 'contributions', 'area', 'adminUser']);

        return $this->successResponse(new CooperativeResource($cooperative));
    }

    /**
     * Admin: update cooperative status.
     */
    public function adminUpdateStatus(Request $request, Cooperative $cooperative): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:forming,active,target_reached,completed,dissolved'],
        ]);

        $cooperative->update(['status' => CooperativeStatus::from($validated['status'])]);

        return $this->successResponse(new CooperativeResource($cooperative), 'Cooperative status updated.');
    }

    /**
     * Admin: soft delete cooperative.
     */
    public function adminDestroy(Cooperative $cooperative): JsonResponse
    {
        $cooperative->delete();

        return $this->successResponse(null, 'Cooperative deleted.', 204);
    }
}
