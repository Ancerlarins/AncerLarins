<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Services\SubscriptionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Subscriptions
 *
 * Agent subscription plans and payment management via Paystack.
 */
class SubscriptionController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SubscriptionService $subscriptionService,
    ) {}

    public function plans(): JsonResponse
    {
        return $this->successResponse($this->subscriptionService->getPlans());
    }

    /**
     * Initialize Payment
     *
     * Start a Paystack payment for a subscription tier upgrade.
     *
     * @authenticated
     * @bodyParam tier string required The subscription tier. Allowed: basic, pro, enterprise. Example: basic
     *
     * @response 200 {"success": true, "message": "Payment initialized.", "data": {"authorization_url": "https://paystack.com/pay/...", "access_code": "access_...", "reference": "ref_..."}}
     * @response 422 {"success": false, "message": "Payment initialization failed."}
     */
    public function initialize(Request $request): JsonResponse
    {
        $request->validate([
            'tier' => 'required|string|in:basic,pro,enterprise',
        ]);

        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $result = $this->subscriptionService->initializePayment($agent, $request->tier);

        if (! ($result['status'] ?? false)) {
            return $this->errorResponse($result['message'] ?? 'Payment initialization failed.', 422);
        }

        return $this->successResponse([
            'authorization_url' => $result['authorization_url'],
            'access_code'       => $result['access_code'],
            'reference'         => $result['reference'],
        ], 'Payment initialized.');
    }

    /**
     * Verify Payment
     *
     * Verify a Paystack payment and activate the subscription.
     *
     * @authenticated
     * @bodyParam reference string required The Paystack payment reference. Example: ref_abc123
     *
     * @response 200 {"success": true, "message": "Subscription activated.", "data": {}}
     * @response 422 {"success": false, "message": "Payment verification failed or already processed."}
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'reference' => 'required|string',
        ]);

        $subscription = $this->subscriptionService->verifyAndActivate($request->reference);

        if (! $subscription) {
            return $this->errorResponse('Payment verification failed or already processed.', 422);
        }

        return $this->successResponse(
            new SubscriptionResource($subscription),
            'Subscription activated.'
        );
    }

    /** @authenticated */
    public function current(Request $request): JsonResponse
    {
        $agent = $request->user()->agentProfile;

        if (! $agent) {
            return $this->errorResponse('Agent profile not found.', 404);
        }

        $activeSubscription = $agent->subscriptions()->active()->latest('created_at')->first();

        return $this->successResponse([
            'tier'               => $agent->subscription_tier,
            'expires_at'         => $agent->subscription_expires_at,
            'max_listings'       => $agent->max_listings,
            'active_listings'    => $agent->active_listings,
            'has_active'         => $agent->hasActiveSubscription(),
            'subscription'       => $activeSubscription ? new SubscriptionResource($activeSubscription) : null,
        ]);
    }
}
