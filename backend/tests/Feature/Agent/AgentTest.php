<?php

namespace Tests\Feature\Agent;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesTestData;

class AgentTest extends TestCase
{
    use CreatesTestData, RefreshDatabase;

    // ── Public: List Agents ──────────────────────────────────

    public function test_can_list_verified_agents(): void
    {
        $agentData = $this->createVerifiedAgent();

        $response = $this->getJson('/api/v1/agents');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_can_view_agent_profile(): void
    {
        $agentData = $this->createVerifiedAgent();

        $response = $this->getJson("/api/v1/agents/{$agentData['profile']->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Public: Agent Listings ───────────────────────────────

    public function test_can_view_agent_listings(): void
    {
        $agentData = $this->createVerifiedAgent();
        $this->createApprovedProperty($agentData['profile']);
        $this->createApprovedProperty($agentData['profile']);

        $response = $this->getJson("/api/v1/agents/{$agentData['profile']->id}/listings");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Public: Agent Reviews ────────────────────────────────

    public function test_can_view_agent_reviews(): void
    {
        $agentData = $this->createVerifiedAgent();

        $response = $this->getJson("/api/v1/agents/{$agentData['profile']->id}/reviews");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Auth: Create Review ──────────────────────────────────

    public function test_authenticated_user_can_create_review(): void
    {
        $user = $this->createVerifiedUser();
        $agentData = $this->createVerifiedAgent();

        $response = $this->actingAs($user)
            ->postJson("/api/v1/agents/{$agentData['profile']->id}/reviews", [
                'agent_profile_id' => $agentData['profile']->id,
                'overall_rating' => 4,
                'comment' => 'Great agent, very professional!',
            ]);

        // 201 or 200 depending on if ReviewService creates successfully
        $response->assertSuccessful();
    }

    public function test_unauthenticated_cannot_create_review(): void
    {
        $agentData = $this->createVerifiedAgent();

        $response = $this->postJson("/api/v1/agents/{$agentData['profile']->id}/reviews", [
            'agent_profile_id' => $agentData['profile']->id,
            'overall_rating' => 5,
            'comment' => 'Wonderful service!',
        ]);

        $response->assertUnauthorized();
    }

    // ── Agent: Update Profile ────────────────────────────────

    public function test_agent_can_update_profile(): void
    {
        $agentData = $this->createVerifiedAgent();

        $response = $this->actingAs($agentData['user'])
            ->putJson('/api/v1/agent/profile', [
                'company_name' => 'Updated Realty Co',
                'bio' => 'Experienced real estate agent.',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_non_agent_cannot_update_agent_profile(): void
    {
        $user = $this->createVerifiedUser();

        $response = $this->actingAs($user)
            ->putJson('/api/v1/agent/profile', [
                'company_name' => 'Fake Realty',
            ]);

        $response->assertForbidden();
    }

    // ── Agent: Dashboard ─────────────────────────────────────

    public function test_agent_can_view_dashboard(): void
    {
        $agentData = $this->createVerifiedAgent();

        $response = $this->actingAs($agentData['user'])
            ->getJson('/api/v1/agent/dashboard');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_non_agent_cannot_access_agent_dashboard(): void
    {
        $user = $this->createVerifiedUser();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/agent/dashboard');

        $response->assertForbidden();
    }

    // ── Agent: Leads ─────────────────────────────────────────

    public function test_agent_can_view_leads(): void
    {
        $agentData = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agentData['profile']);

        Lead::factory()->count(3)->create([
            'agent_id' => $agentData['profile']->id,
            'property_id' => $property->id,
        ]);

        $response = $this->actingAs($agentData['user'])
            ->getJson('/api/v1/agent/leads');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    // ── Agent: Respond to Lead ───────────────────────────────

    public function test_agent_can_respond_to_own_lead(): void
    {
        $agentData = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($agentData['profile']);

        $lead = Lead::factory()->create([
            'agent_id' => $agentData['profile']->id,
            'property_id' => $property->id,
        ]);

        $response = $this->actingAs($agentData['user'])
            ->putJson("/api/v1/agent/leads/{$lead->id}/respond");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_agent_cannot_respond_to_other_agents_lead(): void
    {
        $agentData = $this->createVerifiedAgent();
        $otherAgent = $this->createVerifiedAgent();
        $property = $this->createApprovedProperty($otherAgent['profile']);

        $lead = Lead::factory()->create([
            'agent_id' => $otherAgent['profile']->id,
            'property_id' => $property->id,
        ]);

        $response = $this->actingAs($agentData['user'])
            ->putJson("/api/v1/agent/leads/{$lead->id}/respond");

        $response->assertForbidden();
    }
}
