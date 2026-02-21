<?php

namespace Tests\Feature\Subscription;

use App\Models\AgentProfile;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase, CreatesTestData;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('send')->andReturn(new \App\Models\Notification());
        });
    }

    // ── Plans ────────────────────────────────────────────────

    public function test_list_subscription_plans(): void
    {
        $response = $this->getJson('/api/v1/subscription/plans');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(4, $response->json('data'));
    }

    // ── Initialize Payment ───────────────────────────────────

    public function test_agent_can_initialize_payment(): void
    {
        $agent = $this->createVerifiedAgent();

        $this->mock(SubscriptionService::class, function ($mock) {
            $mock->shouldReceive('getPlans')->andReturn([
                ['tier' => 'free'], ['tier' => 'basic'], ['tier' => 'pro'], ['tier' => 'enterprise'],
            ]);
            $mock->shouldReceive('initializePayment')->once()->andReturn([
                'status'            => true,
                'authorization_url' => 'https://paystack.com/pay/test',
                'access_code'       => 'access_test',
                'reference'         => 'ref_test_123',
            ]);
        });

        $response = $this->actingAs($agent['user'])->postJson('/api/v1/agent/subscription/initialize', [
            'tier' => 'basic',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reference', 'ref_test_123');
    }

    public function test_initialize_fails_for_invalid_tier(): void
    {
        $agent = $this->createVerifiedAgent();

        $response = $this->actingAs($agent['user'])->postJson('/api/v1/agent/subscription/initialize', [
            'tier' => 'free',
        ]);

        $response->assertStatus(422);
    }

    // ── Verify Payment ───────────────────────────────────────

    public function test_agent_can_verify_payment(): void
    {
        $agent = $this->createVerifiedAgent();

        $this->mock(SubscriptionService::class, function ($mock) {
            $mock->shouldReceive('getPlans')->andReturn([
                ['tier' => 'free'], ['tier' => 'basic'], ['tier' => 'pro'], ['tier' => 'enterprise'],
            ]);
            $mock->shouldReceive('verifyAndActivate')->once()->andReturn(
                new \App\Models\AgentSubscription([
                    'tier'              => 'basic',
                    'amount_kobo'       => 15000,
                    'payment_reference' => 'ref_123',
                    'status'            => 'active',
                    'starts_at'         => now(),
                    'ends_at'           => now()->addDays(30),
                ])
            );
        });

        $response = $this->actingAs($agent['user'])->postJson('/api/v1/agent/subscription/verify', [
            'reference' => 'ref_123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_verify_fails_invalid_reference(): void
    {
        $agent = $this->createVerifiedAgent();

        $this->mock(SubscriptionService::class, function ($mock) {
            $mock->shouldReceive('getPlans')->andReturn([
                ['tier' => 'free'], ['tier' => 'basic'], ['tier' => 'pro'], ['tier' => 'enterprise'],
            ]);
            $mock->shouldReceive('verifyAndActivate')->once()->andReturn(null);
        });

        $response = $this->actingAs($agent['user'])->postJson('/api/v1/agent/subscription/verify', [
            'reference' => 'bad_ref',
        ]);

        $response->assertStatus(422);
    }

    // ── Current Subscription ─────────────────────────────────

    public function test_agent_can_view_current_subscription(): void
    {
        $agent = $this->createVerifiedAgent();

        $response = $this->actingAs($agent['user'])->getJson('/api/v1/agent/subscription/current');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['tier', 'max_listings']]);
    }
}
