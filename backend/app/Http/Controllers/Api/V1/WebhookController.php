<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CooperativeService;
use App\Services\SubscriptionService;
use App\Services\WhatsAppBotService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * @group Webhooks
 *
 * Payment and SMS webhook handlers (Paystack, Termii). Verified by signature, no auth required.
 */
class WebhookController extends Controller
{
    use ApiResponse;

    /** Maximum age (in seconds) before a webhook event is considered stale. */
    private const MAX_EVENT_AGE_SECONDS = 300; // 5 minutes

    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected WhatsAppBotService $whatsAppBotService,
        protected CooperativeService $cooperativeService,
    ) {}

    public function paystack(Request $request): JsonResponse
    {
        // ── Signature verification ──────────────────────────
        $secret = config('services.paystack.secret_key');

        if ($secret && $request->header('x-paystack-signature') !== hash_hmac('sha512', $request->getContent(), $secret)) {
            Log::warning('Paystack webhook: invalid signature');
            return response()->json(['status' => 'invalid signature'], 403);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        // ── Timestamp staleness check ───────────────────────
        $createdAt = $data['created_at'] ?? $data['createdAt'] ?? null;

        if ($createdAt) {
            try {
                $eventTime = Carbon::parse($createdAt);
                $age = $eventTime->diffInSeconds(now(), false);

                if ($age > self::MAX_EVENT_AGE_SECONDS) {
                    Log::warning('Paystack webhook: stale event rejected', [
                        'event'  => $event,
                        'age_s'  => $age,
                        'max_s'  => self::MAX_EVENT_AGE_SECONDS,
                    ]);
                    return response()->json(['status' => 'stale event'], 200);
                }
            } catch (\Exception $e) {
                // Cannot parse timestamp — log but don't block
                Log::info('Paystack webhook: unparseable timestamp', ['created_at' => $createdAt]);
            }
        }

        // ── Idempotency check ───────────────────────────────
        $eventId = (string) ($data['id'] ?? $data['reference'] ?? '');

        if ($eventId && $this->isAlreadyProcessed('paystack', $eventId)) {
            Log::info('Paystack webhook: duplicate event ignored', ['event' => $event, 'id' => $eventId]);
            return response()->json(['status' => 'already processed'], 200);
        }

        Log::info('Paystack webhook received', ['event' => $event, 'id' => $eventId]);

        // ── Handle event ────────────────────────────────────
        match ($event) {
            'charge.success'       => $this->handlePaystackChargeSuccess($data),
            'subscription.create'  => $this->handlePaystackSubscriptionCreate($data),
            'subscription.disable' => $this->handlePaystackSubscriptionDisable($data),
            default                => Log::info('Unhandled Paystack event', ['event' => $event]),
        };

        // ── Mark as processed ───────────────────────────────
        if ($eventId) {
            $this->markProcessed('paystack', $eventId, $event);
        }

        return response()->json(['status' => 'ok']);
    }

    public function termii(Request $request): JsonResponse
    {
        Log::info('Termii webhook received', $request->all());

        // Handle inbound SMS for WhatsApp bot
        $phone = $request->input('from') ?? $request->input('phone') ?? $request->input('msisdn');
        $message = $request->input('message') ?? $request->input('sms') ?? $request->input('text');

        if ($phone && $message) {
            $this->whatsAppBotService->handleIncoming($phone, $message);
        }

        return response()->json(['status' => 'ok']);
    }

    // ── Paystack handlers ───────────────────────────────────

    protected function handlePaystackChargeSuccess(array $data): void
    {
        $reference = $data['reference'] ?? null;
        Log::info('Paystack charge.success', ['reference' => $reference]);

        $metadataType = $data['metadata']['type'] ?? null;

        if ($metadataType === 'cooperative_contribution' && $reference) {
            $this->cooperativeService->verifyContribution($reference);
            return;
        }

        $this->subscriptionService->handleChargeSuccess($data);
    }

    protected function handlePaystackSubscriptionCreate(array $data): void
    {
        Log::info('Paystack subscription.create', ['subscription_code' => $data['subscription_code'] ?? null]);

        // Subscription creation is handled via charge.success + verify flow
        // This event is logged for auditing purposes
    }

    protected function handlePaystackSubscriptionDisable(array $data): void
    {
        Log::info('Paystack subscription.disable', ['subscription_code' => $data['subscription_code'] ?? null]);

        $this->subscriptionService->handleSubscriptionDisable($data);
    }

    // ── Idempotency helpers ─────────────────────────────────

    private function isAlreadyProcessed(string $provider, string $eventId): bool
    {
        return DB::table('processed_webhooks')
            ->where('provider', $provider)
            ->where('event_id', $eventId)
            ->exists();
    }

    private function markProcessed(string $provider, string $eventId, ?string $eventType): void
    {
        DB::table('processed_webhooks')->insertOrIgnore([
            'provider'     => $provider,
            'event_id'     => $eventId,
            'event_type'   => $eventType,
            'processed_at' => now(),
        ]);
    }
}
